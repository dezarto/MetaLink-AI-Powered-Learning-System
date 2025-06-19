using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class LessonService : ILessonService
    {
        private readonly ILessonRepository _lessonRepository;

        public LessonService(ILessonRepository lessonRepository)
        {
            _lessonRepository = lessonRepository;
        }

        public async Task AddLessonAsync(Lesson lesson)
        {
            await _lessonRepository.AddAsync(lesson);
        }

        public async Task DeleteLessonAsync(Lesson lesson)
        {
            await _lessonRepository.DeleteAsync(lesson);
        }

        public Task<List<Lesson>> GetAllLessonAsync()
        {
            return _lessonRepository.GetAllAsync();
        }

        public async Task<List<Lesson>> GetLessonByCourseIdAsync(int courseId)
        {
            return await _lessonRepository.GetByCourseIdAsync(courseId);
        }

        public async Task<Lesson?> GetLessonByIdAsync(int id)
        {
            return await _lessonRepository.GetByIdAsync(id);
        }

        public async Task SaveChangesAsync()
        {
            await _lessonRepository.SaveChangesAsync();
        }

        public async Task UpdateLessonAsync(Lesson lesson)
        {
            await _lessonRepository.UpdateAsync(lesson);
        }
    }
}
