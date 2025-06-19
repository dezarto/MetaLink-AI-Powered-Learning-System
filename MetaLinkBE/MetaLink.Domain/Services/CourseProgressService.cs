using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class CourseProgressService : ICourseProgressService
    {
        private readonly ICourseProgressRepository _repository;

        public CourseProgressService(ICourseProgressRepository repository)
        {
            _repository = repository;
        }

        public async Task<CourseProgress> GetCourseProgressByStudentIdAsync(int studentId, int courseId, ProgressTypeEnum progressTypeEnum)
        {
            return await _repository.GetCourseProgressByStudentIdAsync(studentId, courseId, progressTypeEnum);
        }

        public async Task<IEnumerable<CourseProgress>> GetAllCourseProgressesAsync()
        {
            return await _repository.GetAllCourseProgressesAsync();
        }

        public async Task<CourseProgress> CreateCourseProgressAsync(CourseProgress courseProgress)
        {
            return await _repository.CreateCourseProgressAsync(courseProgress);
        }

        public async Task<CourseProgress> UpdateCourseProgressAsync(CourseProgress courseProgress)
        {
            return await _repository.UpdateCourseProgressAsync(courseProgress);
        }

        public async Task<bool> DeleteCourseProgressAsync(int progressId)
        {
            return await _repository.DeleteCourseProgressAsync(progressId);
        }
    }
}
