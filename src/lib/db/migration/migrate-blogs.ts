/**
 * One-time migration: import blog data from the old schema into the new schema,
 * including downloading and uploading the cover image to R2.
 *
 * Run: bun run db:migrate:blogs
 */

import { eq } from "drizzle-orm";
import { db } from "../index";
import { blogs, media, users } from "../schema";
import { R2Service } from "../../r2/r2.service";

const USERNAME = "Ponleu";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
};

// ---------------------------------------------------------------------------
// Add more blog entries here as needed
// ---------------------------------------------------------------------------
const blogData = [
  {
    id: "273775bb-f316-4fe5-8c48-93721b0f1743",
    title: "Working on Array Sum",
    description:
      "When working on Sator Backend, I was working with a way to answer form related to a website that the user wanted and get the quoted price for that website.",
    slug: "working-on-array-sum-fEvFeDvHZ_",
    published_at: "2025-03-17 09:33:52.177",
    created_at: "2025-03-13 07:09:00.683",
    updated_at: "2025-03-17 09:33:52.178",
    cover_url:
      "https://sator-portfolio-bucket-0.s3-ap-southeast-1.amazonaws.com/1741849666091-javascript array.jpeg",
    content: [
      {
        id: "2387a130-f14e-414c-b1d7-521371a8577b",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "When working on Sator Backend, I was working with a way to answer form related to a website that the user wanted and get the quoted price for that website. In order to make this happen, I needed to work on a way to sum and accumulate price/price range. ", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "aa6592f5-83b4-4279-a9fa-96fbcbe0d047",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [
          { text: "For context, I have 3 relevant entities, ", type: "text", styles: {} },
          { text: "Form Response", type: "text", styles: { code: true } },
          { text: ", ", type: "text", styles: {} },
          { text: "Form Option", type: "text", styles: { code: true } },
          { text: ", ", type: "text", styles: {} },
          { text: "Form Attempt ", type: "text", styles: { code: true } },
          { text: "each works in it corresponsed name. The price is located in the ", type: "text", styles: {} },
          { text: "Form Option", type: "text", styles: { code: true } },
          { text: ", and my idea is to allow user to query their ", type: "text", styles: {} },
          { text: "Form Attempt", type: "text", styles: { code: true } },
          { text: " and see the quoted price which is the total sum of all the option that they've selected.", type: "text", styles: {} },
        ],
        children: [],
      },
      {
        id: "741abd5f-0004-4511-a82b-3f49dc70a291",
        type: "codeBlock",
        props: { language: "javascript" },
        content: [{ text: "\nmodel FormOption {\n  id            String         @id @default(uuid())\n  question_id   String\n  created_at    DateTime       @default(now())\n  updated_at    DateTime       @updatedAt\n  option_text   String\n  type          QuestionType   @default(SINGLE_CHOICE)\n  price         Float[]\n  metadata      Json?\n  form_question FormQuestion   @relation(fields: [question_id], references: [id], onDelete: Cascade)\n  form_response FormResponse[]\n}", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "a906968f-f28f-43f0-a057-816a8a96e4d9",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "My initial attempt is like this. When user query for the attempt, I would db get the attempt, then th db get the option from the response, do a calculation, and then join them together. This present many challenges like how to sum 2 arrays? precisely how to sum price range?, etc. Let go through the whole process and walk through the problem, bad and then solution.", type: "text", styles: {} }],
        children: [],
      },
      { id: "09bbaeeb-03a2-4e27-8ca4-19e380c59cfb", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      { id: "7f3e3990-5671-4100-8c10-5e2f2eea80a2", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      {
        id: "c94e297b-4168-48c9-bf01-595c18617f97",
        type: "heading",
        props: { level: 1, textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "The Problem", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "465b0820-9114-4df6-9804-3e03b9b6fff9",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "There are many way to sum the element in the array but not 2 array. More specifically I am working with price range and thus it has to abide by these 3 rules: ", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "eaec54ea-ce1d-496c-b534-7b4f392c9c38",
        type: "numberedListItem",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "The element cannot be more 2 ", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "42ee64a8-bdf4-4313-a028-dfc4c1767bab",
        type: "numberedListItem",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "If the sum between 2 array, one is full (have 2 element) and the other is half (have only 1 element), then when doing sum, the half element has to be add to both element. Example: [1, 2] + [1] = [2,3]", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "cf202e0b-409d-4fb1-bb58-6f7362e7e307",
        type: "numberedListItem",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "If the sum is between full and full then it will sum 1 to 1. Example: [1, 1] + [1, 1] = [2, 2]", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "c634784a-0cc3-4aec-9a6d-dc3db388be0c",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "My attempt is to first find the min and max of the 2 arrays, then do a loop to the maxlength, then add the element of the min length - 1, doing this will ensure that it follow the 2 rules.", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "e403cbf9-984c-4a95-ba6f-1df8c980a9e8",
        type: "codeBlock",
        props: { language: "typescript" },
        content: [{ text: "const sumArray = (arr1: number[], arr2: number[]) => {\n  const maxLength = Math.max(arr1.length, arr2.length);\n  if (maxLength > 2) return [];\n  const minLength = Math.min(arr1.length, arr2.length);\n  const result = [];\n  for (let i = 0; i < maxLength; i++) {\n    const sum =\n      (arr1[i] || arr1[minLength - 1]) + (arr2[i] || arr2[minLength - 1]);\n    result.push(sum);\n  }\n  return result;\n};", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "83e1380a-ad6b-4cfc-8289-b2940bed4a00",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "This works great, but there is some downside that needed refinement with the way I was setting up the entity.", type: "text", styles: {} }],
        children: [],
      },
      { id: "1898674d-fa1e-49ab-b24f-b1566dbd7b89", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      { id: "a97ab0ec-7154-4f96-9cb3-b9e1ed993077", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      {
        id: "d25748e5-99da-47b5-8bbd-f03fd7da626d",
        type: "heading",
        props: { level: 1, textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "The Bad", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "812c6073-d1c0-4d08-b69d-cd0133dacdc3",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [
          { text: "So the way I set up thing required me to basically do 2 db call in one request, which slow down the query time quite a bit. Both the db call and the function run time slow down the query perfomance. Not to mention, It is a nightmare to work with when doing the ", type: "text", styles: {} },
          { text: "Form Attempt", type: "text", styles: { code: true } },
          { text: " pagination.", type: "text", styles: {} },
        ],
        children: [],
      },
      { id: "852ef3c6-fcbd-4419-b620-f4393cdb320a", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      { id: "1a1ad1f0-68fb-4756-8a6e-10abef059233", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
      {
        id: "c1c962b8-3eae-4b3d-992b-ec6b110c8ba4",
        type: "heading",
        props: { level: 1, textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [{ text: "The Solution", type: "text", styles: {} }],
        children: [],
      },
      {
        id: "3cd44c12-4343-45ad-9c7a-d55d31f129db",
        type: "paragraph",
        props: { textColor: "default", textAlignment: "left", backgroundColor: "default" },
        content: [
          { text: "Well it is quite simple, add another field to the ", type: "text", styles: {} },
          { text: "Form Attempt", type: "text", styles: { code: true } },
          { text: " and when we creating the form attempt which in turn we will need to create the ", type: "text", styles: {} },
          { text: "Form Response", type: "text", styles: { code: true } },
          { text: " which again will have the form option. But, there is another challenge when trying to do this, and that is the ", type: "text", styles: {} },
          { text: "Form Response", type: "text", styles: { code: true } },
          { text: " is an array, how do we attract the price of the option in the response and add them together?. Well, we will need to somehow iterate through the array object, then accumulate it into a single value. This call for the use of ", type: "text", styles: {} },
          { text: "reduce", type: "text", styles: { code: true } },
          { text: ". We go through the array object then accumulate it with the ", type: "text", styles: {} },
          { text: "sumArray", type: "text", styles: { code: true } },
          { text: " function so that in the final step we are left with a single price range.", type: "text", styles: {} },
        ],
        children: [],
      },
      {
        id: "3a2d8117-e9e8-4184-8c69-a395d6dd19ff",
        type: "codeBlock",
        props: { language: "javascript" },
        content: [{ text: " const price = responses.reduce(\n        (prev, curr) => {\n          return sumArray(prev, curr.form_option.price);\n        },\n        [0, 0]\n);", type: "text", styles: {} }],
        children: [],
      },
      { id: "3b669d94-18ba-4503-8dc3-d05d351c1c6c", type: "paragraph", props: { textColor: "default", textAlignment: "left", backgroundColor: "default" }, content: [], children: [] },
    ],
  },
];

// ---------------------------------------------------------------------------

async function uploadCover(
  coverUrl: string,
  userId: number,
): Promise<number | null> {
  const rawName = coverUrl.split("/").pop() ?? "cover";
  const fileName = decodeURIComponent(rawName);
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const mimeType = MIME[ext] ?? "application/octet-stream";
  const storageKey = `users/${userId}/covers/${Date.now()}-${fileName}`;

  console.log(`  Fetching cover: ${fileName} ...`);

  const res = await fetch(coverUrl);
  if (!res.ok) {
    console.warn(`  ⚠ Failed to fetch cover (${res.status}), skipping`);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await R2Service.upload(storageKey, buffer, mimeType);

  const [inserted] = await db
    .insert(media)
    .values({
      storage_key: storageKey,
      file_name: fileName,
      mime_type: mimeType,
      size: buffer.byteLength,
      user_id: userId,
    })
    .returning({ id: media.id });

  console.log(`  ✓ Cover uploaded → media id=${inserted.id}`);
  return inserted.id;
}

async function main() {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, USERNAME))
    .limit(1);

  if (!user) {
    throw new Error(`User "${USERNAME}" not found. Run the seed first.`);
  }

  console.log(`Found user id: ${user.id}`);

  for (const blog of blogData) {
    console.log(`\nMigrating blog: "${blog.title}"`);

    const coverAssetId = await uploadCover(blog.cover_url, user.id);

    await db
      .insert(blogs)
      .values({
        id: blog.id,
        title: blog.title,
        description: blog.description,
        slug: blog.slug,
        content: blog.content,
        cover_asset_id: coverAssetId,
        published_at: blog.published_at ?? null,
        created_at: new Date(blog.created_at),
        updated_at: new Date(blog.updated_at),
        user_id: user.id,
      })
      .onConflictDoNothing({ target: blogs.id });

    console.log(`  ✓ Blog inserted: ${blog.id}`);
  }

  console.log("\nDone — all blogs migrated.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
