namespace Metalink.Domain.Entities
{
    public class StudentSubLesson
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int SubLessonId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public double Progress { get; set; }
    }
}
