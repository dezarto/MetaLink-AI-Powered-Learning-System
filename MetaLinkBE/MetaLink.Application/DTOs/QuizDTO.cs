namespace MetaLink.Application.DTOs
{
    public class QuizDTO
    {
        public int QuizID { get; set; }
        public int SubLessonID { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
