namespace MetaLink.Application.Responses
{
    public class CourseLessonSubLessonManagementResponse
    {
        public List<CourseResponse>? Courses { get; set; }
    }

    public class CourseResponse
    {
        public int CourseID { get; set; }
        public string Name { get; set; }
        public int ClassLevel { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }

        public List<LessonsResponse>? Lessons { get; set; }
    }

    public class LessonsResponse
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }

        public List<SubLessonsResponse>? SubLessons { get; set; }
    }

    public class SubLessonsResponse
    {
        public int SubLessonID { get; set; }
        public int LessonID { get; set; }
        public string Title { get; set; }
        public string? LessonObjective { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }
    }
}
