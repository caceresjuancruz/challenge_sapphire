export interface Comment {
  id: string;
  content: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
