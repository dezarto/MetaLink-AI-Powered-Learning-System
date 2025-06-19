namespace MetaLink.Application.Responses
{
    public class TestProcessResponse
    {
        public int StudentID { get; set; }
        public List<CourseProgressResponse> CourseProcess { get; set; }
    }

    public class CourseProgressResponse
    {
        public int CourseID { get; set; }
        public string? CourseName { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int Progress { get; set; }
        public int? TotalLesson { get; set; }
        public int? CompleatedLessonCount { get; set; }
        public int? TotalSubLesson { get; set; }
        public int? CompleatedSubLessonCount { get; set; }
        public List<LessonProgressResponse> LessonsProgress { get; set; }
    }

    public class LessonProgressResponse
    {
        public int LessonID { get; set; }
        public string? LessonName { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int Progress { get; set; }
        public List<SubLessonProgressResponse>? SubLessonsProgress { get; set; }
    }

    public class SubLessonProgressResponse 
    {
        public int SubLessonID { get; set; }
        public string? SubLessonName { get; set; }
        public string? LessonObjective { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int Progress { get; set; }
    }
}
