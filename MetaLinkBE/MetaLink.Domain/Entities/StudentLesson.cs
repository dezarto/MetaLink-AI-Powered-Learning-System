namespace Metalink.Domain.Entities
{
    public class StudentLesson
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int LessonId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public double Progress { get; set; }
    }
}
