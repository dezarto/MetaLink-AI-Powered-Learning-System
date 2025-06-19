using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface ILessonRepository
    {
        Task AddAsync(Lesson lesson);
        Task UpdateAsync(Lesson lesson);
        Task DeleteAsync(Lesson lesson);
        Task SaveChangesAsync();

        Task<List<Lesson>> GetAllAsync();
        Task<Lesson?> GetByIdAsync(int id);
        Task<List<Lesson>> GetByCourseIdAsync(int courseId);
    }
}
