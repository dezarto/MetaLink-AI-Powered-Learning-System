namespace Metalink.Application.DTOs
{
    public class LessonDTO
    {
        public int? Id { get; set; }
        public int? CourseId { get; set; }
        public string? Title { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdateDate { get; set; }
    }
}
