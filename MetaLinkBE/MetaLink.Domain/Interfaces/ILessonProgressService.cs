using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Interfaces
{
    public interface ILessonProgressService
    {
        Task<LessonProgress> GetLessonProgressByStudentIdAsync(int studentId, int lessonId, ProgressTypeEnum progressTypeEnum);
        Task<IEnumerable<LessonProgress>> GetAllLessonProgressesAsync();
        Task<LessonProgress> CreateLessonProgressAsync(LessonProgress lessonProgress);
        Task<LessonProgress> UpdateLessonProgressAsync(LessonProgress lessonProgress);
        Task<bool> DeleteLessonProgressAsync(int progressId);
    }
}
