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
  source: "ETS 2024 · Test 1 · Q68–70",
  audioSrc: "/landing/part3-sample.mp3",
  imageSrc: "/landing/part3-sample.avif",
  label: "Part 3 · Conversations",
  hint: "3 questions share one audio",
  // From Documents/toeic/ets_24/test_01/part_3.json (group ets24-t01-p3-g068-070)
  transcriptEn:
    "M: I'm glad we were assigned to cover the press conference earlier today. I counted seven other major media networks there, in addition to ours.\n\nW: Well, the offshore wind industry is going to transform the way this region gets its power.\n\nM: Agreed. Let's compare our facts before we start writing.\n\nW: So the largest cluster of wind turbines—off the coast of Winston—is already built. The other sites are at different stages of construction, though Lanchester is also close to being done.\n\nM: Right. And I think it's crucial for us to focus on how many new jobs related to assembling and maintaining the turbines are opening up in the area as a result of this.",
  transcriptVi:
    "Nam: Tôi mừng là chúng ta được phân công đưa tin về buổi họp báo sớm hôm nay. Tôi đếm được bảy mạng lưới truyền thông lớn khác ở đó, ngoài mạng của chúng ta.\n\nNữ: À, ngành công nghiệp điện gió ngoài khơi sẽ thay đổi cách khu vực này lấy năng lượng.\n\nNam: Đồng ý. Hãy so sánh các dữ kiện của chúng ta trước khi bắt đầu viết.\n\nNữ: Vậy cụm tuabin gió lớn nhất – ngoài khơi bờ biển Winston – đã được xây dựng xong. Các địa điểm khác đang ở các giai đoạn xây dựng khác nhau, mặc dù Lanchester cũng sắp hoàn thành.\n\nNam: Đúng vậy. Và tôi nghĩ điều quan trọng là chúng ta tập trung vào việc có bao nhiêu công việc mới liên quan đến lắp ráp và bảo trì các tuabin đang mở ra trong khu vực nhờ vào điều này.",
  questions: [
    {
      id: "ets24-t01-p3-q068",
      number: 68,
      prompt: "Who most likely are the speakers?",
      options: {
        A: "Urban planners",
        B: "Journalists",
        C: "Engineers",
        D: "Environmental scientists",
      },
      answerKey: "B",
    },
    {
      id: "ets24-t01-p3-q069",
      number: 69,
      prompt: "Look at the graphic. Which site has already been completed?",
      options: {
        A: "Site A",
        B: "Site B",
        C: "Site C",
        D: "Site D",
      },
      answerKey: "D",
    },
    {
      id: "ets24-t01-p3-q070",
      number: 70,
      prompt: "What does the man suggest focusing on?",
      options: {
        A: "Work opportunities",
        B: "Wind turbine costs",
        C: "Supply chain issues",
        D: "Power capacity",
      },
      answerKey: "A",
    },
  ] satisfies LandingPart3Question[],
} as const;
