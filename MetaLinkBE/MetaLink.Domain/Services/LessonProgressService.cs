using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class LessonProgressService : ILessonProgressService
    {
        private readonly ILessonProgressRepository _repository;

        public LessonProgressService(ILessonProgressRepository repository)
        {
            _repository = repository;
        }

        public async Task<LessonProgress> GetLessonProgressByStudentIdAsync(int studentId, int lessonId, ProgressTypeEnum progressTypeEnum)
        {
            return await _repository.GetLessonProgressByStudentIdAsync(studentId, lessonId, progressTypeEnum);
        }

        public async Task<IEnumerable<LessonProgress>> GetAllLessonProgressesAsync()
        {
            return await _repository.GetAllLessonProgressesAsync();
        }

        public async Task<LessonProgress> CreateLessonProgressAsync(LessonProgress lessonProgress)
        {
            return await _repository.CreateLessonProgressAsync(lessonProgress);
        }

        public async Task<LessonProgress> UpdateLessonProgressAsync(LessonProgress lessonProgress)
        {
            return await _repository.UpdateLessonProgressAsync(lessonProgress);
        }

        public async Task<bool> DeleteLessonProgressAsync(int progressId)
        {
            return await _repository.DeleteLessonProgressAsync(progressId);
        }
    }
}
