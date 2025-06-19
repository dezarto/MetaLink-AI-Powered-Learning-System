using Metalink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ILessonService
    {
        Task AddLessonAsync(Lesson lesson);
        Task UpdateLessonAsync(Lesson lesson);
        Task DeleteLessonAsync(Lesson lesson);
        Task<List<Lesson>> GetAllLessonAsync();
        Task<Lesson?> GetLessonByIdAsync(int id);
        Task<List<Lesson>> GetLessonByCourseIdAsync(int courseId);
        Task SaveChangesAsync();
    }
}
