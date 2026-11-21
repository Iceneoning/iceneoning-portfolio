/** 首页分区的唯一配置来源：展示顺序、锚点与 MDX 分类枚举保持一致。 */
export const projectSections = [
  { id: 'games', title: '游戏', english: 'GAMES & INTERACTIVE', intro: '玩法、交互与游戏系统的设计和实现。' },
  { id: 'graphics', title: '图形学与渲染', english: 'GRAPHICS & RENDERING', intro: '从渲染原理、着色器到视觉表达的探索。' },
  { id: 'frontend', title: '前端开发', english: 'FRONTEND ENGINEERING', intro: '互动叙事、跑团回放与技术写作。' },
  { id: 'backend', title: '后端开发', english: 'BACKEND ENGINEERING', intro: '服务端工程实习与 Java 游戏扩展实践。' },
  { id: 'misc', title: '杂项', english: 'SMALL WORKS & EXPERIMENTS', intro: '一些值得留下的小工具、小实验和灵感。' },
] as const;

export type ProjectCategory = (typeof projectSections)[number]['id'];
