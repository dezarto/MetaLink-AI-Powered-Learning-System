using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;

        public CourseService(ICourseRepository courseRepository)
        {
            _courseRepository = courseRepository;
        }

        public async Task AddCourseAsync(Course course)
        {
            await _courseRepository.AddAsync(course);
        }

        public async Task DeleteCourseAsync(Course course)
        {
            await _courseRepository.DeleteAsync(course);
        }

        public async Task<List<Course>> GetAllCourseAsync()
        {
            return await _courseRepository.GetAllAsync();
        }

        public async Task<Course?> GetCourseByIdAsync(int id)
        {
            return await _courseRepository.GetByIdAsync(id);
        }

        public async Task SaveChangesAsync()
        {
            await _courseRepository.SaveChangesAsync();
        }

        public async Task UpdateCourseAsync(Course course)
        {
            await _courseRepository.UpdateAsync(course);
        }
    }
}
