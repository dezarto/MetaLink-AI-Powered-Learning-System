using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class StudentTestStatisticService : IStudentTestStatisticService
    {
        private readonly IStudentTestStatisticRepository _repository;

        public StudentTestStatisticService(IStudentTestStatisticRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<StudentTestStatistic>> GetBySubLessonIdAsync(int subLessonId)
        {
            return await _repository.GetBySubLessonIdAsync(subLessonId);
        }

    

        public async Task<IEnumerable<StudentTestStatistic>> GetBySubLessonQuizIdAsync(int subLessonId)
        {
            return await _repository.GetBySubLessonQuizIdAsync(subLessonId);
        }


        public async Task<List<StudentTestStatistic>> GetStatisticByStudentAsync(int studentId)
        {
            return await _repository.GetStatisticByStudentAsync(studentId);
        }

        public async Task<IEnumerable<StudentTestStatistic>> GetAllStatisticAsync()
        {
            return await _repository.GetAllStatisticAsync();
        }

        public async Task<StudentTestStatistic> CreateStatisticAsync(StudentTestStatistic statistic)
        {
            return await _repository.CreateStatisticAsync(statistic);
        }

        public async Task<StudentTestStatistic> UpdateStatisticAsync(StudentTestStatistic statistic)
        {
            return await _repository.UpdateStatisticAsync(statistic);
        }

        public async Task<bool> DeleteStatisticAsync(int statisticId)
        {
            return await _repository.DeleteStatisticAsync(statisticId);
        }
    }
}
