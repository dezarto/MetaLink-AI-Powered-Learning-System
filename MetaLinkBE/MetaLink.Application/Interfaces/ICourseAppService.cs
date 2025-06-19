using Metalink.Application.DTOs;
using MetaLink.Application.Responses;

namespace Metalink.Application.Interfaces
{
    public interface ICourseAppService
    {
        Task<CourseLessonSubLessonManagementResponse> GetCourseLessonsSubLessonsInformationAsync(int studentId);
        Task<List<CourseProgressResponse>> GetCourseProgressByStudentId(int studentId);
    }
}
