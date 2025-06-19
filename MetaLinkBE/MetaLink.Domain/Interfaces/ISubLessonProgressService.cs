using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ISubLessonProgressService
    {
        Task<SubLessonProgress> GetSubLessonProgressByStudentIdAsync(int studentId, int subLessonId);
        Task<IEnumerable<SubLessonProgress>> GetAllSubLessonProgressesAsync();
        Task<SubLessonProgress> CreateSubLessonProgressAsync(SubLessonProgress subLessonProgress);
        Task<SubLessonProgress> UpdateSubLessonProgressAsync(SubLessonProgress subLessonProgress);
        Task<bool> DeleteSubLessonProgressAsync(int progressId);
    }
}
