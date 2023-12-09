import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { serialize } from "next-mdx-remote/serialize";
import { replaceTweets } from "@/lib/remark-plugins";

export async function getSiteData(domain: string) {
  const cleanDomain = domain.replace('%3A', ':');
  const subdomain = cleanDomain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? cleanDomain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  // return await unstable_cache(
    // async () => {
      return prisma.organization.findUnique({
        where: subdomain ? { subdomain } : { customDomain: domain },
        include: {
          pageLinks: true
        }
      });
    // },
    // [`${cleanDomain}-metadata`],
    // {
    //   revalidate: 900,
    //   tags: [`${cleanDomain}-metadata`],
    // },
  // )();
}

export async function getPostsForOrganization(domain: string) {
  const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  return await unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          organization: subdomain ? { subdomain } : { customDomain: domain },
          published: true,
        },
        select: {
          title: true,
          description: true,
          slug: true,
          image: true,
          imageBlurhash: true,
          createdAt: true,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
        ],
      });
    },
    [`${domain}-posts`],
    {
      revalidate: 900,
      tags: [`${domain}-posts`],
    },
  )();
}

export async function getPostData(domain: string, slug: string) {
  const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  return await unstable_cache(
    async () => {
      const data = await prisma.post.findFirst({
        where: {
          organization: subdomain ? { subdomain } : { customDomain: domain },
          slug,
          published: true,
        },
        include: {
          organization: true,
          user: true
        },
      });

      if (!data) return null;

      const [mdxSource, adjacentPosts] = await Promise.all([
        getMdxSource(data.content!),
        prisma.post.findMany({
          where: {
            organization: subdomain ? { subdomain } : { customDomain: domain },
            published: true,
            NOT: {
              id: data.id,
            },
          },
          select: {
            slug: true,
            title: true,
            createdAt: true,
            description: true,
            image: true,
            imageBlurhash: true,
          },
        }),
      ]);

      return {
        ...data,
        mdxSource,
        adjacentPosts,
      };
    },
    [`${domain}-${slug}`],
    {
      revalidate: 900, // 15 minutes
      tags: [`${domain}-${slug}`],
    },
  )();
}

async function getMdxSource(postContents: string) {
  // transforms links like <link> to [link](link) as MDX doesn't support <link> syntax
  // https://mdxjs.com/docs/what-is-mdx/#markdown
  const content =
    postContents?.replaceAll(/<(https?:\/\/\S+)>/g, "[$1]($1)") ?? "";
  // Serialize the content string into MDX
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [replaceTweets],
    },
  });

  return mdxSource;
}

// export async function getEventData(domain: string, slug: string) {
//   const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
//     ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
//     : null;

//   return await unstable_cache(
//     async () => {
//       const data = await prisma.event.findFirst({
//         where: {
//           organization: subdomain ? { subdomain } : { customDomain: domain },
//           slug,
//           published: true,
//         },
//         include: {
//           organization: true,
//         },
//       });

//       if (!data) return null;

//       const [mdxSource, adjacentPosts] = await Promise.all([
//         getMdxSource(data.content!),
//         prisma.post.findMany({
//           where: {
//             organization: subdomain ? { subdomain } : { customDomain: domain },
//             published: true,
//             NOT: {
//               id: data.id,
//             },
//           },
//           select: {
//             slug: true,
//             title: true,
//             createdAt: true,
//             description: true,
//             image: true,
//             imageBlurhash: true,
//           },
//         }),
//       ]);

//       return {
//         ...data,
//         mdxSource,
//         adjacentPosts,
//       };
//     },
//     [`${domain}-${slug}`],
//     {
//       revalidate: 900, // 15 minutes
//       tags: [`${domain}-${slug}`],
//     },
//   )();
// }
