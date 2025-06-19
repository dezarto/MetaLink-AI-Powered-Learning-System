namespace Metalink.Application.DTOs
{
    public class SubLessonDTO
    {
        public int? SubLessonID { get; set; }
        public int? LessonID { get; set; }
        public string Title { get; set; }
        public string LessonObjective { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdateDate { get; set; }
    }
}
