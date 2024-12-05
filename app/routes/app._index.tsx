import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  ResourceList,
  ResourceItem,
  Thumbnail
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";
import ThreeJSViewer from "./components/threejs-viewer";

interface Product {
  id: string;
  title: string;
  description: string;
  media: {
    edges: Array<{
      node: {
        __typename: string;
        image?: {
          originalSrc: string;
          altText: string;
        };
        sources?: Array<{
          url: string;
          format: string;
        }>;
      };
    }>;
  };
}

interface LoaderData {
  products: Product[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 25) {
        edges {
          node {
            id
            title
            description
            media(first: 10) {
              edges {
                node {
                  ... on MediaImage {
                    id
                    image {
                      originalSrc
                      altText
                    }
                  }
                  ... on Model3d {
                    id
                    sources {
                      url
                      format
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`);

  const responseJson = await response.json();
  console.log("Responz: ", responseJson); // Írd ki a válaszadatokat a konzolra

  const {
    data: { products },
  } = responseJson;

  return json({ products: products.edges.map((edge: any) => edge.node) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const { products } = useLoaderData<LoaderData>();

  useEffect(() => {
    console.log("Responz: ", products); // Írd ki a termékadatokat a konzolra
  }, [products]);

  const threeDTestProduct = products.find(product => product.title === "3D test");
  const threeDTestProductGLB = threeDTestProduct?.media.edges
    .filter(edge => edge.node.__typename === "Model3d")
    .flatMap(edge => edge.node.sources)
    .find(source => source.format === "glb");

  console.log("threeDTestProductGLB:", threeDTestProductGLB); // Írd ki a threeDTestProductGLB értékét a konzolra

  return (
    <Page>
      <TitleBar title="WebGPU 3D Viewer">
        <button variant="primary">
          Click me
        </button>
      </TitleBar>
      <Layout>
      <Layout.Section>
          <Card title="3D Test Product">
            <ThreeJSViewer modelUrl={"https://cdn.shopify.com/3d/models/o/a8dff314a2d4d45c/2103.glb"} />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Products
            </Text>
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={products}
              renderItem={(product) => {
                const { id, title, description, media } = product;
                const mediaImage = media.edges.find(edge => edge.node.__typename === "MediaImage");
                const media3d = media.edges.find(edge => edge.node.__typename === "Model3d");

                return (
                  <ResourceItem
                    id={id}
                    media={
                      mediaImage ? (
                        <Thumbnail
                          source={mediaImage.node.image!.originalSrc}
                          alt={mediaImage.node.image!.altText}
                        />
                      ) : (
                        <Thumbnail
                          source="https://via.placeholder.com/100"
                          alt="No image available"
                        />
                      )
                    }
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <h3>
                      <Text variant="headingSm">{title}</Text>
                    </h3>
                    <div>{description}</div>
                    {media3d && (
                      <a href={media3d.node.sources![0].url} target="_blank" rel="noopener noreferrer">
                        View 3D Model
                      </a>
                    )}
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
        
      </Layout>
    </Page>
  );
}