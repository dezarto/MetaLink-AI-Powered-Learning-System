using MetaLink.Domain.Enums;

namespace MetaLink.Application.DTOs
{
    public class LessonProgressDTO
    {
        public int ProgressID { get; set; }
        public int StudentID { get; set; }
        public int LessonID { get; set; }
        public int CourseID { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int Progress { get; set; }
        public ProgressTypeEnum ProgressType { get; set; }
    }
}
