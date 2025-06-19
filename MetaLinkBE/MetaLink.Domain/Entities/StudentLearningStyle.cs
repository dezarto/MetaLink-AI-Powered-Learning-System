namespace Metalink.Domain.Entities
{
    public class StudentLearningStyle
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string LearningStyle { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
