using AutoMapper;
using Metalink.Application.Interfaces;
using Metalink.Domain.Interfaces;
using MetaLink.Application.Responses;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;
using MetaLink.Domain.Services;

namespace Metalink.Application.Services
{
    public class CourseAppService : ICourseAppService
    {
        private readonly IMapper _mapper;
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly ISubLessonService _subLessonService;
        private readonly IStudentService _studentService;
        private readonly ICourseProgressService _courseProgressService;
        private readonly ILessonProgressService _lessonProgressService;
        private readonly ISubLessonProgressService _subLessonProgressService;

        public CourseAppService(IMapper mapper, ICourseService courseService, ILessonService lessonService, ISubLessonService subLessonService, IStudentService studentService, ICourseProgressService courseProgressService, ILessonProgressService lessonProgressService, ISubLessonProgressService subLessonProgressService)
        {
            _mapper = mapper;
            _courseService = courseService;
            _lessonService = lessonService;
            _subLessonService = subLessonService;
            _studentService = studentService;
            _courseProgressService = courseProgressService;
            _lessonProgressService = lessonProgressService;
            _subLessonProgressService = subLessonProgressService;
        }

        public async Task<CourseLessonSubLessonManagementResponse> GetCourseLessonsSubLessonsInformationAsync(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException(nameof(student), "Student not found!");

            var courses = await _courseService.GetAllCourseAsync();
            var lessons = await _lessonService.GetAllLessonAsync();
            var subLessons = await _subLessonService.GetAllSubLessonAsync();

            var filteredCourses = courses.Where(course => course.ClassLevel == student.Class).ToList();

            var response = new CourseLessonSubLessonManagementResponse
            {
                Courses = filteredCourses.Select(course => new CourseResponse
                {
                    CourseID = course.CourseID,
                    Name = course.Name,
                    ClassLevel = course.ClassLevel,
                    CreateDate = course.CreateDate,
                    UpdateDate = course.UpdateDate,
                    Lessons = lessons
                        .Where(l => l.CourseID == course.CourseID)
                        .Select(lesson => new LessonsResponse
                        {
                            Id = lesson.LessonID,
                            CourseId = lesson.CourseID,
                            Title = lesson.Title,
                            CreateDate = lesson.CreateDate,
                            UpdateDate = lesson.UpdateDate,
                            SubLessons = subLessons
                                .Where(s => s.LessonID == lesson.LessonID)
                                .Select(sub => new SubLessonsResponse
                                {
                                    SubLessonID = sub.SubLessonID,
                                    LessonID = sub.LessonID,
                                    Title = sub.Title,
                                    LessonObjective = sub.LessonObjective,
                                    CreateDate = sub.CreateDate,
                                    UpdateDate = sub.UpdateDate
                                }).ToList()
                        }).ToList()
                }).ToList()
            };

            return response;
        }

        public async Task<List<CourseProgressResponse>> GetCourseProgressByStudentId(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            var response = new List<CourseProgressResponse>();

            var allCourses = await _courseService.GetAllCourseAsync();
            var filteredCourses = allCourses.Where(c => c.ClassLevel == student.Class).ToList();

            foreach (var course in filteredCourses)
            {
                var courseProgress = await _courseProgressService.GetCourseProgressByStudentIdAsync(studentId, course.CourseID, ProgressTypeEnum.Course);

                var courseProgressResponse = new CourseProgressResponse
                {
                    CourseID = course.CourseID,
                    CourseName = course.Name,
                    IsCompleted = courseProgress?.IsCompleted ?? false,
                    CompletionDate = courseProgress?.CompletionDate,
                    Progress = courseProgress?.Progress ?? 0,
                    TotalLesson = 0,
                    CompleatedLessonCount = 0,
                    TotalSubLesson = 0,
                    CompleatedSubLessonCount = 0,
                    LessonsProgress = new List<LessonProgressResponse>()
                };

                var lessons = await _lessonService.GetLessonByCourseIdAsync(course.CourseID);
                courseProgressResponse.TotalLesson = lessons.Count;

                foreach (var lesson in lessons)
                {
                    var lessonProgress = await _lessonProgressService.GetLessonProgressByStudentIdAsync(studentId, lesson.LessonID, ProgressTypeEnum.Course);

                    var lessonProgressResponse = new LessonProgressResponse
                    {
                        LessonID = lesson.LessonID,
                        LessonName = lesson.Title,
                        IsCompleted = lessonProgress?.IsCompleted ?? false,
                        CompletionDate = lessonProgress?.CompletionDate,
                        Progress = lessonProgress?.Progress ?? 0,
                        SubLessonsProgress = new List<SubLessonProgressResponse>()
                    };

                    if (lessonProgressResponse.IsCompleted)
                    {
                        courseProgressResponse.CompleatedLessonCount++;
                    }

                    var subLessons = await _subLessonService.GetSubLessonByLessonIdAsync(lesson.LessonID);
                    courseProgressResponse.TotalSubLesson += subLessons.Count;

                    foreach (var sublesson in subLessons)
                    {
                        var subLessonProgress = await _subLessonProgressService.GetSubLessonProgressByStudentIdAsync(studentId, sublesson.SubLessonID);

                        var sublessonProgressResponse = new SubLessonProgressResponse
                        {
                            CompletionDate = subLessonProgress?.CompletionDate,
                            IsCompleted = subLessonProgress?.IsCompleted ?? false,
                            SubLessonID = sublesson.SubLessonID,
                            LessonObjective = sublesson.LessonObjective,
                            Progress = subLessonProgress?.Progress ?? 0,
                            SubLessonName = sublesson.Title,
                        };

                        if (sublessonProgressResponse.IsCompleted)
                        {
                            courseProgressResponse.CompleatedSubLessonCount++;
                        }

                        lessonProgressResponse.SubLessonsProgress.Add(sublessonProgressResponse);
                    }

                    courseProgressResponse.LessonsProgress.Add(lessonProgressResponse);
                }

                response.Add(courseProgressResponse);
            }

            return response;
        }
    }
}
