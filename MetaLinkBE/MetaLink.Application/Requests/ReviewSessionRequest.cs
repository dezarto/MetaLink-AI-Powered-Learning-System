namespace MetaLink.Application.Requests
{
    public class ReviewSessionRequest
    {
        public int StudentId { get; set; }
        public int SubLessonId { get; set; }
        public bool NewContent { get; set; }
    }
}
