namespace Metalink.Domain.Entities
{
    public class Lesson
    {
        public int LessonID { get; set; }
        public int CourseID { get; set; }
        public string Title { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }
    }
}
