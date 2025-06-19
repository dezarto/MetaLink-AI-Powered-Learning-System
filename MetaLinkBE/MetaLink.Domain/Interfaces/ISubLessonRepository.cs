using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface ISubLessonRepository
    {
        Task<List<SubLesson>> GetAllAsync();
        Task<SubLesson?> GetByIdAsync(int id);
        Task<List<SubLesson>> GetByLessonIdAsync(int lessonId);
        Task AddAsync(SubLesson subLesson);
        Task UpdateAsync(SubLesson subLesson);
        Task DeleteAsync(SubLesson subLesson);
        Task SaveChangesAsync();
    }
}
