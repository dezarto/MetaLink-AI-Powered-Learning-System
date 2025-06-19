using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Entities
{
    public class Test
    {
        public int TestID { get; set; }
        public int? SubLessonID { get; set; }
        public int? LessonID { get; set; }
        public int StudentId { get; set; }
        public TestTypeEnum TestType { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool IsSolved { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
