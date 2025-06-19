using Metalink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ICourseService
    {
        Task AddCourseAsync(Course course);
        Task UpdateCourseAsync(Course course);
        Task DeleteCourseAsync(Course course);
        Task SaveChangesAsync();
        Task<List<Course>> GetAllCourseAsync();
        Task<Course?> GetCourseByIdAsync(int id);
    }
}
