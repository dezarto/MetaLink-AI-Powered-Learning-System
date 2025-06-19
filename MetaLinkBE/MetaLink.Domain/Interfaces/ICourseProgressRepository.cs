using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Interfaces
{
    public interface ICourseProgressRepository
    {
        Task<CourseProgress> GetCourseProgressByStudentIdAsync(int studentId, int courseId, ProgressTypeEnum progressTypeEnum);
        Task<IEnumerable<CourseProgress>> GetAllCourseProgressesAsync();
        Task<CourseProgress> CreateCourseProgressAsync(CourseProgress courseProgress);
        Task<CourseProgress> UpdateCourseProgressAsync(CourseProgress courseProgress);
        Task<bool> DeleteCourseProgressAsync(int progressId);
    }
}
