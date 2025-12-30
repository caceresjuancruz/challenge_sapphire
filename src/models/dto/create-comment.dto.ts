export interface CreateCommentDto {
  content: string;
  authorId: string;
  parentId?: string;
}
