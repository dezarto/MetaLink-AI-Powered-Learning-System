using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class SubLessonProgressService : ISubLessonProgressService
    {
        private readonly ISubLessonProgressRepository _repository;

        public SubLessonProgressService(ISubLessonProgressRepository repository)
        {
            _repository = repository;
        }

        public async Task<SubLessonProgress> GetSubLessonProgressByStudentIdAsync(int studentId, int subLessonId)
        {
            return await _repository.GetSubLessonProgressByStudentIdAsync(studentId, subLessonId);
        }

        public async Task<IEnumerable<SubLessonProgress>> GetAllSubLessonProgressesAsync()
        {
            return await _repository.GetAllSubLessonProgressesAsync();
        }

        public async Task<SubLessonProgress> CreateSubLessonProgressAsync(SubLessonProgress subLessonProgress)
        {
            return await _repository.CreateSubLessonProgressAsync(subLessonProgress);
        }

        public async Task<SubLessonProgress> UpdateSubLessonProgressAsync(SubLessonProgress subLessonProgress)
        {
            return await _repository.UpdateSubLessonProgressAsync(subLessonProgress);
        }

        public async Task<bool> DeleteSubLessonProgressAsync(int progressId)
        {
            return await _repository.DeleteSubLessonProgressAsync(progressId);
        }
    }
}
