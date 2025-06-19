using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class SubLessonService : ISubLessonService
    {
        private readonly ISubLessonRepository _subLessonRepository;

        public SubLessonService(ISubLessonRepository subLessonRepository)
        {
            _subLessonRepository = subLessonRepository;
        }

        public async Task AddSubLessonAsync(SubLesson subLesson)
        {
            await _subLessonRepository.AddAsync(subLesson);
        }

        public async Task DeleteSubLessonAsync(SubLesson subLesson)
        {
            await _subLessonRepository.DeleteAsync(subLesson);
        }

        public async Task<List<SubLesson>> GetAllSubLessonAsync()
        {
            return await _subLessonRepository.GetAllAsync();
        }

        public async Task<SubLesson?> GetSubLessonByIdAsync(int id)
        {
            return await _subLessonRepository.GetByIdAsync(id);
        }

        public async Task<List<SubLesson>> GetSubLessonByLessonIdAsync(int lessonId)
        {
            return await _subLessonRepository.GetByLessonIdAsync(lessonId);
        }

        public async Task SaveChangesAsync()
        {
            await _subLessonRepository.SaveChangesAsync();
        }

        public async Task UpdateSubLessonAsync(SubLesson subLesson)
        {
            await _subLessonRepository.UpdateAsync(subLesson);
        }
    }
}
