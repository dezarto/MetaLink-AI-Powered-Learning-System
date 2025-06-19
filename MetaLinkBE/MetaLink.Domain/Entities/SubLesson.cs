namespace Metalink.Domain.Entities
{
    public class SubLesson
    {
        public int SubLessonID { get; set; }
        public int LessonID { get; set; }
        public string Title { get; set; }
        public string? LessonObjective { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }
    }
}
