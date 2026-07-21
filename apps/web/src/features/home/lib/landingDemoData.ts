export const LANDING_VOCAB_DEMO_WORD = {
  word: "negotiate",
  type: "v.",
  band: "B2",
  ipaUk: "nɪˈɡəʊʃieɪt",
  meaningVi: "đàm phán, thương lượng",
  definition: "to discuss something in order to reach an agreement",
  example: "They negotiated a better contract with the supplier.",
  exampleVi: "Họ đã đàm phán một hợp đồng tốt hơn với nhà cung cấp.",
} as const;

export const LANDING_VOCAB_DEMO_METRICS = {
  due: 12,
  mastered: 48,
  difficult: 5,
} as const;

export const LANDING_CATALOG_COLLECTIONS = [
  {
    id: "oxford",
    title: "Oxford 3000",
    description: "Essential words for everyday English.",
    cefr: "A1–B2",
    wordCount: "3,000 words",
  },
  {
    id: "toeic",
    title: "TOEIC Core",
    description: "High-frequency business and workplace vocabulary.",
    cefr: "B1–C1",
    wordCount: "1,200 words",
  },
  {
    id: "ielts",
    title: "IELTS Academic",
    description: "Academic words for reading and writing tasks.",
    cefr: "B2–C1",
    wordCount: "800 words",
  },
] as const;

export type LandingOptionKey = "A" | "B" | "C" | "D";

export type LandingPart3Question = {
  id: string;
  number: number;
  prompt: string;
  options: Record<LandingOptionKey, string>;
  answerKey: LandingOptionKey;
};

export const LANDING_PART3_DEMO = {
  source: "ETS 2024 · Test 1 · Q32–34",
  audioSrc: "/landing/part3-sample.mp3",
  label: "Part 3 · Conversations",
  hint: "3 questions share one audio",
  // From Documents/toeic/ets_24/test_01/part_3.json (group ets24-t01-p3-g032-034)
  transcriptEn:
    "W: Thank you so much for organizing the annual company picnic, Jingdao. Everybody seemed to enjoy it.\n\nM: Well, we deserved it after working so hard this year.\n\nW: I agree. The food was great, by the way. Especially the peach pie you made. Would you mind sharing the recipe? It was delicious.\n\nM: I found the recipe online. I'll send you a link to the Web page. There's a really helpful video that walks you through all the steps. I recommend you watch it first.\n\nW: All right, thanks.",
  transcriptVi:
    "Nữ: Cảm ơn Jingdao rất nhiều vì đã tổ chức buổi dã ngoại thường niên của công ty, Mọi người dường như đều rất thích.\n\nNam: Ừ, chúng ta xứng đáng có buổi đó sau khi làm việc vất vả cả năm nay.\n\nNữ: Tôi đồng ý. Nhân tiện, đồ ăn rất ngon. Đặc biệt là cái bánh đào bạn làm. Bạn có phiền chia sẻ công thức không? Nó ngon lắm.\n\nNam: Tôi tìm thấy công thức đó trên mạng. Tôi sẽ gửi cho bạn một đường link đến trang Web. Có một video hướng dẫn rất hữu ích dẫn bạn qua tất cả các bước. Tôi khuyên bạn nên xem video đó trước.\n\nNữ: Được rồi, cảm ơn nhé.",
  questions: [
    {
      id: "ets24-t01-p3-q032",
      number: 32,
      prompt: "What event does the woman mention?",
      options: {
        A: "A job fair",
        B: "A cooking class",
        C: "A fund-raiser",
        D: "A company picnic",
      },
      answerKey: "D",
    },
    {
      id: "ets24-t01-p3-q033",
      number: 33,
      prompt: "What does the woman ask for?",
      options: {
        A: "A guest list",
        B: "A dessert recipe",
        C: "A business card",
        D: "A promotional code",
      },
      answerKey: "B",
    },
    {
      id: "ets24-t01-p3-q034",
      number: 34,
      prompt: "What does the man recommend doing?",
      options: {
        A: "Returning some merchandise",
        B: "Watching a video",
        C: "Creating an account",
        D: "Reading a review",
      },
      answerKey: "B",
    },
  ] satisfies LandingPart3Question[],
} as const;
