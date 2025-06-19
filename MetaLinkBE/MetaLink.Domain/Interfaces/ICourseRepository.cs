using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface ICourseRepository
    {
        Task AddAsync(Course course);
        Task UpdateAsync(Course course);
        Task DeleteAsync(Course course);
        Task SaveChangesAsync();
        Task<List<Course>> GetAllAsync();
        Task<Course?> GetByIdAsync(int id);
    }
}
