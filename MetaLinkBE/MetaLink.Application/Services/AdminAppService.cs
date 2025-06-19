using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace Metalink.Application.AppServices
{
    public class AdminService : IAdminAppService
    {
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserRepository _userRepository;
        private readonly IStudentRepository _studentRepository;
        private readonly IAvatarService _avatarService;
        private readonly ICourseRepository _courseRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly ISubLessonRepository _subLessonRepository;
        private readonly IAiPromptService _aiPromptService;
        private readonly ICompanyProfileService _companyProfileService;
        private readonly IGameService _gameService;

        public AdminService(IMapper mapper, IWebHostEnvironment webHostEnvironment, IPasswordHasher passwordHasher, IUserRepository userRepository, IStudentRepository studentRepository, IAvatarService avatarService, ICourseRepository courseRepository, ILessonRepository lessonRepository, ISubLessonRepository subLessonRepository, IAiPromptService aiPromptService, ICompanyProfileService companyProfileService, IGameService gameService)
        {
            _mapper = mapper;
            _webHostEnvironment = webHostEnvironment;
            _passwordHasher = passwordHasher;
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _avatarService = avatarService;
            _courseRepository = courseRepository;
            _lessonRepository = lessonRepository;
            _subLessonRepository = subLessonRepository;
            _aiPromptService = aiPromptService;
            _companyProfileService = companyProfileService;
            _gameService = gameService;
        }

        #region Parent&Student Management

        public async Task<ParentStudentManagementResponse> GetParentAndStudentInformationAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var students = await _studentRepository.GetAllAsync();

            var parents = users
                .Select(p => new ParentResponse
                {
                    Id = p.UserID,
                    Email = p.Email,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    Phone = p.Phone,
                    IsActive = p.IsActive,
                    DateOfBirth = p.DateOfBirth,
                    Pin = p.Pin,
                    Students = students
                        .Where(s => s.UserID == p.UserID)
                        .Select(s => new StudentResponse
                        {
                            StudentID = s.StudentID,
                            UserID = s.UserID,
                            SelectedAvatarID = s.SelectedAvatarID,
                            FirstName = s.FirstName,
                            LastName = s.LastName,
                            Class = s.Class,
                            Gender = s.Gender,
                            DateOfBirth = s.DateOfBirth,
                            CreateDate = s.CreateDate,
                            UpdateDate = s.UpdateDate,
                            ThemeChoice = s.ThemeChoice,
                            LearningStyleCompleated = s.LearningStyleCompleated,
                            LearningStyleType = s.LearningStyleType,
                            Role = s.Role
                        }).ToList()
                })
                .ToList();

            return new ParentStudentManagementResponse
            {
                Parents = parents
            };
        }

        public async Task<bool> CreateParentAsync(CreateParentRequest request)
        {
            var existing = await _userRepository.GetByEmailAsync(request.Email);
            if (existing != null)
                throw new Exception("User already exists.");

            var user = new User
            {
                Email = request.Email,
                Password = _passwordHasher.HashPassword(request.Password),
                Pin = request.Pin,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Phone = request.Phone,
                DateOfBirth = request.DateOfBirth,
                IsActive = true,
                Role = "User",
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateParentAsync(int parentId, UpdateParentRequest request)
        {
            var user = await _userRepository.GetByIdAsync(parentId);

            if (user == null)
                throw new Exception("Parent not found.");

            user.Email = request.Email;
            user.Pin = request.Pin;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Phone = request.Phone;
            user.DateOfBirth = request.DateOfBirth;
            user.UpdateDate = DateTime.UtcNow;
            user.IsActive = request.IsActive;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteParentAsync(int parentId)
        {
            var user = await _userRepository.GetByIdAsync(parentId);
            if (user == null)
                return false;

            var students = await _studentRepository.GetAllAsync();
            var parentStudents = students.Where(s => s.UserID == parentId).ToList();

            foreach (var student in parentStudents)
            {
                await _studentRepository.DeleteAsync(student);
            }

            // tüm endpointler bittikten sonra diğer bağımlılıkların silinmesi eklenece

            await _userRepository.DeleteAsync(user);

            await _userRepository.SaveChangesAsync();
            await _studentRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CreateStudentAsync(CreateStudentRequest request, int parentId)
        {
            var user = await _userRepository.GetByIdAsync(parentId);
            if (user == null) throw new ArgumentException("Parent not found!");

            var student = new Student
            {
                UserID = parentId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Class = request.Class,
                Gender = request.Gender,
                DateOfBirth = request.DateOfBirth,
                ThemeChoice = request.ThemeChoice,
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
                LearningStyleCompleated = false,
                Role = "Student",
                SelectedAvatarID = 1,
            };

            await _studentRepository.AddAsync(student);
            await _studentRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateStudentAsync(int studentId, UpdateStudentRequest request)
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
                throw new Exception("Student not found.");

            student.FirstName = request.FirstName;
            student.LastName = request.LastName;
            student.Class = request.Class;
            student.Gender = request.Gender;
            student.DateOfBirth = request.DateOfBirth;
            student.UpdateDate = DateTime.UtcNow;
            
            await _studentRepository.UpdateAsync(student);
            await _studentRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteStudentAsync(int studentId)
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
                return false;

            // tüm endpointler bittikten sonra diğer bağımlılıkların silinmesi eklenece

            await _studentRepository.DeleteAsync(student);
            await _studentRepository.SaveChangesAsync();

            return true;
        }

        #endregion

        #region Avatar Operations

        public async Task<List<AvatarDTO>> GetAllAvatarsAsync()
        {
            var avatars = await _avatarService.GetAllAvatarAsync();

            // Avatarları DTO'ya dönüştür
            var avatarDTOs = _mapper.Map<List<AvatarDTO>>(avatars);

            // wwwroot/avatars klasöründeki tüm dosyaları listele
            string avatarDirectory = Path.Combine(_webHostEnvironment.WebRootPath, "avatars");
            var avatarFiles = Directory.GetFiles(avatarDirectory)
                                       .Select(Path.GetFileName)
                                       .ToList();

            // Avatar path'leri güncelle
            foreach (var avatar in avatarDTOs)
            {
                // Aynı isimde olan dosyanın tam adını bul (jpg, png, vb.)
                string matchedFile = avatarFiles.FirstOrDefault(f =>
                    Path.GetFileNameWithoutExtension(f).Equals(avatar.AvatarName, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(matchedFile))
                {
                    avatar.AvatarPath = $"/avatars/{matchedFile}"; // Gerçek uzantıyı korur
                }
            }

            return avatarDTOs;
        }

        public async Task<bool> CreateAvatarAsync(CreateAvatarRequest request)
        {
            string base64Data = request.Base64Image;
            string extension;

            if (base64Data.StartsWith("data:image/png"))
                extension = ".png";
            else if (base64Data.StartsWith("data:image/jpeg") || base64Data.StartsWith("data:image/jpg"))
                extension = ".jpg";
            else
                throw new InvalidOperationException("Sadece PNG ve JPG formatı desteklenmektedir.");

            var base64String = base64Data.Substring(base64Data.IndexOf(",") + 1);

            var imageBytes = Convert.FromBase64String(base64String);

            string fileName = $"{Guid.NewGuid()}{extension}";
            string folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            string filePath = Path.Combine(folderPath, fileName);

            await File.WriteAllBytesAsync(filePath, imageBytes);

            string relativePath = Path.Combine("avatars", fileName).Replace("\\", "/");

            var avatar = new Avatar
            {
                AvatarName = request.AvatarName,
                AvatarLevel = request.AvatarLevel,
                isActive = request.isActive,
                AvatarCreateDate = DateTime.UtcNow,
                AvatarUpdateDate = DateTime.UtcNow,
                AvatarPath = relativePath
            };

            await _avatarService.AddAvatarAsync(avatar);

            return true;
        }

        public async Task<bool> UpdateAvatarAsync(int avatarId, UpdateAvatarRequest request)
        {
            var avatar = await _avatarService.GetAvatarByIdAsync(avatarId);
            if (avatar == null)
                throw new Exception("Avatar not found.");

            avatar.AvatarName = request.AvatarName;
            avatar.AvatarLevel = request.AvatarLevel;
            avatar.isActive = request.isActive;
            avatar.AvatarUpdateDate = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Base64Image))
            {
                string base64Data = request.Base64Image;
                string extension;

                if (base64Data.StartsWith("data:image/png"))
                    extension = ".png";
                else if (base64Data.StartsWith("data:image/jpeg") || base64Data.StartsWith("data:image/jpg"))
                    extension = ".jpg";
                else
                    throw new InvalidOperationException("Sadece PNG ve JPG formatı desteklenmektedir.");

                var base64String = base64Data.Substring(base64Data.IndexOf(",") + 1);
                var imageBytes = Convert.FromBase64String(base64String);

                string fileName = $"{Guid.NewGuid()}{extension}";
                string folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                string filePath = Path.Combine(folderPath, fileName);
                await File.WriteAllBytesAsync(filePath, imageBytes);

                string relativePath = Path.Combine("avatars", fileName).Replace("\\", "/");
                avatar.AvatarPath = relativePath;
            }

            await _avatarService.UpdateAvatarAsync(avatar);

            return true;
        }

        public async Task<bool> DeleteAvatarAsync(int avatarId)
        {
            var avatar = await _avatarService.GetAvatarByIdAsync(avatarId);
            if (avatar == null)
                return false;

            if (!string.IsNullOrWhiteSpace(avatar.AvatarPath))
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", avatar.AvatarPath);
                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }

            await _avatarService.DeleteAvatarAsync(avatarId);

            return true;
        }

        #endregion

        #region Course&Lesson&SubLesson Management

        public async Task<CourseLessonSubLessonManagementResponse> GetCourseLessonsSubLessonsInformationAsync()
        {
            var courses = await _courseRepository.GetAllAsync();
            var lessons = await _lessonRepository.GetAllAsync();
            var subLessons = await _subLessonRepository.GetAllAsync();

            var response = new CourseLessonSubLessonManagementResponse
            {
                Courses = courses.Select(course => new CourseResponse
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
                                    LessonObjective = sub.LessonObjective ?? "",
                                    CreateDate = sub.CreateDate,
                                    UpdateDate = sub.UpdateDate
                                }).ToList()
                        }).ToList()
                }).ToList()
            };

            return response;
        }

        public async Task<bool> CreateCourseAsync(CreateCourseRequest request)
        {
            var course = new Course
            {
                Name = request.Name,
                ClassLevel = request.ClassLevel,
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
            };

            await _courseRepository.AddAsync(course);
            await _courseRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateCourseAsync(UpdateCourseRequest request, int courseId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
                throw new Exception("Course not found.");

            course.Name = request.Name;
            course.ClassLevel = request.ClassLevel;
            course.UpdateDate = DateTime.UtcNow;
            
            await _courseRepository.UpdateAsync(course);
            await _courseRepository.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
                return false;

            var lessons = await _lessonRepository.GetAllAsync();
            var courseLessons = lessons.Where(l => l.CourseID == courseId).ToList();

            foreach (var lesson in courseLessons)
            {
                var subLessons = await _subLessonRepository.GetAllAsync();
                var lessonSubLessons = subLessons.Where(s => s.LessonID == lesson.LessonID).ToList();

                foreach (var subLesson in lessonSubLessons)
                {
                    await _subLessonRepository.DeleteAsync(subLesson);
                }

                await _lessonRepository.DeleteAsync(lesson);
            }

            await _courseRepository.DeleteAsync(course);
            await _courseRepository.SaveChangesAsync();
            await _lessonRepository.SaveChangesAsync();
            await _subLessonRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CreateLessonAsync(int courseId, string title)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
                return false;

            var lesson = new Lesson
            {
                CourseID = courseId,
                Title = title,
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
            };

            await _lessonRepository.AddAsync(lesson);
            await _lessonRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateLessonAsync(int lessonId, string title)
        {
            var lesson = await _lessonRepository.GetByIdAsync(lessonId);
            if (lesson == null)
                throw new Exception("Lesson not found.");

            lesson.Title = title;
            lesson.UpdateDate = DateTime.UtcNow;
            
            await _lessonRepository.UpdateAsync(lesson);
            await _lessonRepository.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteLessonAsync(int lessonId)
        {
            var lesson = await _lessonRepository.GetByIdAsync(lessonId);
            if (lesson == null)
                return false;

            var subLessons = await _subLessonRepository.GetAllAsync();
            var lessonSubLessons = subLessons.Where(s => s.LessonID == lessonId).ToList();

            foreach (var subLesson in lessonSubLessons)
            {
                await _subLessonRepository.DeleteAsync(subLesson);
            }

            await _lessonRepository.DeleteAsync(lesson);
            await _lessonRepository.SaveChangesAsync();
            await _subLessonRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CreateSubLessonAsync(int lessonId, SubLessonRequest request)
        {
            var lesson = await _lessonRepository.GetByIdAsync(lessonId);
            if (lesson == null)
                return false;

            var subLesson = new SubLesson
            {
                LessonID = lessonId,
                Title = request.Title,
                LessonObjective = request.LessonObjective,
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
            };

            await _subLessonRepository.AddAsync(subLesson);
            await _subLessonRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateSubLessonAsync(int subLessonId, SubLessonRequest request)
        {
            var subLesson = await _subLessonRepository.GetByIdAsync(subLessonId);
            if (subLesson == null)
                throw new Exception("SubLesson not found.");

            subLesson.Title = request.Title;
            subLesson.LessonObjective = request.LessonObjective;
            subLesson.UpdateDate = DateTime.UtcNow;

            await _subLessonRepository.UpdateAsync(subLesson);
            await _subLessonRepository.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteSubLessonAsync(int subLessonId)
        {
            var subLesson = await _subLessonRepository.GetByIdAsync(subLessonId);
            if (subLesson == null)
                return false;

            await _subLessonRepository.DeleteAsync(subLesson);
            await _subLessonRepository.SaveChangesAsync();
            
            return true;
        }

        #endregion

        #region AI Prompt Management

        public async Task<List<AiPromptDTO>> GetAllAIPrompts()
        {
            var prompts = await _aiPromptService.GetAllAiPromptAsync();
            return _mapper.Map<List<AiPromptDTO>>(prompts);
        }

        public async Task<bool> CreateAIPrompt(AiPromptDTO request)
        {
            var newAIPrompt = new AiPrompt
            {
                ContentType = (ContentTypeEnum)request.ContentType,
                PromptText = request.PromptText,
                CreateDate = DateTime.UtcNow,
            };

            await _aiPromptService.CreateAiPromptAsync(newAIPrompt);

            return true;
        }

        public async Task<bool> UpdateAIPromptsByPromptId(int promptId, AiPromptDTO request)
        {
            var prompt = await _aiPromptService.GetAiPromptByIdAsync(promptId);
            if (prompt == null)
                return false;

            prompt.ContentType = (ContentTypeEnum)request.ContentType;
            prompt.PromptText = request.PromptText;
            
            await _aiPromptService.UpdateAiPromptAsync(prompt);
            return true;
        }

        public async Task<bool> DeleteAIPromptsByPromptId(int promptId)
        {
            var prompt = await _aiPromptService.GetAiPromptByIdAsync(promptId);
            if (prompt == null)
                return false;

            await _aiPromptService.DeleteAiPromptAsync(prompt.PromptID);
            return true;
        }


        #endregion

        #region Company Profile Operations

        public async Task<CompanyProfileDTO?> GetCompanyProfileAsync()
        {
            var entity = await _companyProfileService.GetCompanyProfileAsync();
            return entity is null ? null : _mapper.Map<CompanyProfileDTO>(entity);
        }

        public async Task<bool> CreateCompanyProfileAsync(CompanyProfileDTO profileDto)
        {
            var entity = _mapper.Map<CompanyProfile>(profileDto);
            await _companyProfileService.CreateCompanyProfileAsync(entity);
            return true;
        }

        public async Task<bool> UpdateCompanyProfileAsync(CompanyProfileDTO profileDto)
        {
            var entity = _mapper.Map<CompanyProfile>(profileDto);
            await _companyProfileService.UpdateCompanyProfileAsync(entity);
            return true;
        }

        public async Task<bool> DeleteCompanyProfileAsync(int profileId)
        {
            await _companyProfileService.DeleteCompanyProfileAsync(profileId);
            return true;
        }

        #endregion

        #region Game Operations

        public async Task<List<GameDTO>> GetAllGamesAsync()
        {
            var gameList = await _gameService.GetAllAsync();
            return _mapper.Map<List<GameDTO>>(gameList);
        }

        public async Task<bool> CreateGameAsync(CreateGameRequest request)
        {
            var newGame = new Game
            {
                Description = request.Description,
                Name = request.Name,
                Type = request.Type,
            };

            await _gameService.AddAsync(newGame);

            return true;
        }

        public async Task<bool> UpdateGameAsync(int gameId, UpdateGameRequest request)
        {
            var game = await _gameService.GetByIdAsync(gameId);
            if (game == null) throw new ArgumentException("Game not found!", nameof(game));

            game.Description = request.Description;
            game.Name = request.Name;
            game.Type = request.Type;

            await _gameService.UpdateAsync(game);

            return true;
        }

        public async Task<bool> DeleteGameAsync(int gameId)
        {
            var game = await _gameService.GetByIdAsync(gameId);
            if (game == null) throw new ArgumentException("Game not found!", nameof(game));

            await _gameService.DeleteAsync(gameId);

            return true;
        }

        #endregion
    }
}
