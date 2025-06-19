using Metalink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ISubLessonService
    {
        Task<List<SubLesson>> GetAllSubLessonAsync();
        Task<SubLesson?> GetSubLessonByIdAsync(int id);
        Task<List<SubLesson>> GetSubLessonByLessonIdAsync(int lessonId);
        Task AddSubLessonAsync(SubLesson subLesson);
        Task UpdateSubLessonAsync(SubLesson subLesson);
        Task DeleteSubLessonAsync(SubLesson subLesson);
        Task SaveChangesAsync();
    }
}
