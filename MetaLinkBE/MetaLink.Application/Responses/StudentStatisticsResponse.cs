using Metalink.Domain.Enums;
using MetaLink.Application.DTOs;
using MetaLink.Domain.Entities;

namespace MetaLink.Application.Responses
{
    public class StudentStatisticsResponse
    {
        public int StudentID { get; set; }
        public LearningStyleEnum? LearningStyleType { get; set; }
        public bool LearningStyleCompleated { get; set; }
        public int? Class { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public int? SelectedAvatarID { get; set; }
        public List<StudentTestStatisticResponse> Statistic { get; set; }
        public List<CourseProgressResponse> TestBankProgress { get; set; }
        public List<CourseProgressResponse> CourseProgress { get; set; }
    }
}
