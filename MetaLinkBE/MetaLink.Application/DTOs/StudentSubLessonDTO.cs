using MetaLink.Domain.Enums;

namespace Metalink.Application.DTOs
{
    public class StudentSubLessonDTO
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int SubLessonId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public double Progress { get; set; }
        public ProgressTypeEnum ProgressType { get; set; }
    }
}
