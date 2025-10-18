// Image URLs from Figma Design
export const images = {
  icons: {
    frog: 'https://www.figma.com/api/mcp/asset/9b21ed09-912d-460f-bb75-bea1f4ce1a97',
    tomato: 'https://www.figma.com/api/mcp/asset/3f0b35fc-b4c0-46cb-a44b-2b9a6d454f3f',
    notes: 'https://www.figma.com/api/mcp/asset/09f94197-b689-430a-90d0-f27cb271be3a',
    sparkFab: 'https://www.figma.com/api/mcp/asset/84d7d9cc-68b1-4177-9360-b15c5d4ca56a',
    // Microphone icon from Figma (icon/Microphone)
    microphone: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEuNUM5Ljc5IDEuNSA4IDMuMjkgOCA1LjVWMTEuNUM4IDEzLjcxIDkuNzkgMTUuNSAxMiAxNS41QzE0LjIxIDE1LjUgMTYgMTMuNzEgMTYgMTEuNVY1LjVDMTYgMy4yOSAxNC4yMSAxLjUgMTIgMS41WiIgZmlsbD0iY3VycmVudENvbG9yIi8+CjxwYXRoIGQ9Ik0xOSAxMC41VjExLjVDMTkgMTUuMzYgMTUuODYgMTguNSAxMiAxOC41QzguMTQgMTguNSA1IDE1LjM2IDUgMTEuNVYxMC41SDNWMTEuNUMzIDE2LjQ3IDYuODEgMjAuNSAxMS41IDIwLjk0VjIzSDEyLjVWMjAuOTRDMTcuMTkgMjAuNSAyMSAxNi40NyAyMSAxMS41VjEwLjVIMTlaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPC9zdmc+',
    // SparkAI icon from assets
    sparkAI: require('../../assets/SparkAI_Dark.png'),
    // SparkAI Light icon for microphone button
    sparkAILight: require('../../assets/SparkAI_Light.png'),
    trophy: 'https://www.figma.com/api/mcp/asset/caa5cdbf-1d35-4021-abbc-2d6e0a6264e9',
    createVision: 'https://s3-alpha-sig.figma.com/img/f3ca/910e/67ed334fefa5709829303118cfda1a07?Expires=1760313600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=brlfYbH8KyZQB0EbF5VpV5uvxZg0X5rbH--IHFifnrI6ah-13IWHYm4-OJjt2YtCeH1xY4MFLt~smHvxgIRVi8m5BzfWY5xZQx-xVCoY9aL-gG3wOKr37ggVxgb1rc90gz-R3QpO5ZQIxt8hjovDg4KA6S8EZTjAS57Oc8sZW2gL7IDO1JB6nrTDbFCvtofpjUjLdKHkrbZqfg4GFJMlt8jIDTVA5YPY-opiNWDRcZ39LAKmgPvnqcC03JItsZ3IlaVLRvqIRPjB3-2y7nyWGxSqNQlH0AEivG7b~0OLID3dwnhEwe1HikBvooZA7WjD4ywtpKsy-QaanDMg-1wVcQ__',
    uploadVision: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/mcp/get_code/assets/128e84d7-abfa-48c9-ae4c-bb74a8f820df/figma%3Aasset/23643b4c15a5004868fa4754d8a01f991b53c340.svg?AWSAccessKeyId=ASIAQ4GOSFWCWMZOYSUB&Expires=1759318644&Signature=HP2FHXeR8NNDKryjCkAm11GVnos%3D&response-expires=Wed%2C%2015%20Oct%202025%2011%3A22%3A24%20GMT&x-amz-security-token=IQoJb3JpZ2luX2VjEHsaCXVzLXdlc3QtMiJHMEUCIQCdd7nV2GtIuEDinNHxypHfkwrLXZBkVz1Wp7OuDFmatgIgXgLYIV1MlNIr0hVrRivK%2BTfKq%2FWTthMK4YmMyAK8HcUqhwUIFBAAGgwwNjA1NjI3NDY3NTciDN7GZMy3%2BDkCSd4b9SrkBKWViNvZgz7YCuCO0i97ogNKmYCD7AM6FtP8VOBw38O9EIvkR1ls5%2BjspO2oXhHB5KlZiUcMGetexZjnXNPxlmpmVbx62CVEtE4JOm5yE5bcyzlvv4N6jMVHSFpxRT4528rhpN2BYoBkUtpyfTcybEWIGN7r4vnKUZUw5ES5x1fLKwJid3Q3sr0NYw%2FkATS948P9dQKhVVqLTBRaHEz9flTB17fQ5XJFQKwXjsS97JFfxvhFygN8L%2FWBCtwaD5e0%2BGdUohRIyMbXV57cyREcv7lQxNui%2Bjcnj8LRtw1GD3OtpcQpYmubX%2Bk4apZ7wNKEGsG0K7U94RR7mdVjQOMKoMLUAigKXLI8n8op27iVnfhZgH8fvfR3OfKnWuWdNYQJJZI1FXTdvrHdLRtMgjmuVvBGWwoI9%2FuXsibnv3zKyOvp8yEOqjyQcX7PMjUUA3uPDbvNBNpwIeINxS7k5ORhRWrb34hZMWBelzw11kKuqrs7yDz9%2BMCz0juY6zO2iJ4rszCcydU%2B%2Br7Q7LszNaryNETmJpukVmDcuQTsRfOc0XJVQIamTnwl24%2BpoDAsOU29jpGnZ%2BXDJ009QHRqdMiG1HOAVviLQjeratRJvC6E%2B2rsRTi1duBAUM%2BwQGey49SQALlmMUIyMbg3Ko1aMR6Q8UY%2FyO9eoONw4yuRTqm12jSy4XyzlObqvf5QJBKhGKXUps0Ls2eWEQ0%2Fv5pAfAncqGzgSnFIOm7SRxT329LucpQggQ2nKHww6cCac1hvlRqm3jF8GJ4zSN0SMlsBzh0LTM9%2B5Ne2R0dHUPvzLULcGagcDYyy6TCdjPTGBjqbAdUSubwL%2Fnyfz%2Fuad3J8Rf4RS4jkIqG21P5nYmqm5uxmVRjAz%2B1XNdZ5V2Hziya7cvZbg0NubiwyfCWHevVW0cB2%2Bk59e%2BoJzt4D6EhSHE5ebVRAIoP1%2FnwNMaHPq2sDKyHB0DmFUXzAYwtsTR0WnfPTVnr7WDfNjUsES2dJyFNCzvi6niVnvukGdM9aRQ0MTOxWiLkU62M7cIpm',
  },
  tabIcons: {
    today: 'https://www.figma.com/api/mcp/asset/4c5fb771-8f82-4813-8da4-038c87ae0f10',
    goals: 'https://www.figma.com/api/mcp/asset/38242a58-455f-45f2-be11-5641f4e984a8',
    plan: 'https://www.figma.com/api/mcp/asset/6905aeb6-c552-4356-9e8d-22d007edf54d',
    profile: 'https://www.figma.com/api/mcp/asset/843cef4c-b44d-41d0-8827-728e2c3110b1',
  },
  visionPlaceholder: 'https://www.figma.com/api/mcp/asset/a7d59cac-d4f3-47ed-8bbc-c1a3c7c9e8cc',
} as const;
