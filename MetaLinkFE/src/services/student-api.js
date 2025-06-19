import axios from 'axios';
import authService from './authService';

const API_URL = 'https://localhost:7239/api';

// #region Helper Functions
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${authService.getToken()}`,
    'Content-Type': 'application/json',
  },
});

const getStudentHeaders = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('studentToken')}`,
    'Content-Type': 'application/json',
  },
});

const handleError = (error, action) => {
  let errorMessage = `${action} error: `;
  if (error.response) {
    if (error.response.status === 401) {
      authService.logout(); // Clear token and log out on 401 error
      window.location.href = '/'; // Redirect to home page
    }
    errorMessage += `Server error - ${error.response.status}: ${error.response.data?.message || 'Unknown error'} - ${JSON.stringify(error.response, null, 2)}`;
  } else if (error.request) {
    errorMessage += 'No response from server. Check your network connection.';
  } else {
    errorMessage += `Request error: ${error.message}`;
  }
  console.error(errorMessage);
  throw errorMessage;
};

// #endregion

// #region Student Profile Operations
export const getAllAvatars = async () => {
  try {
    const response = await axios.get(`${API_URL}/student/get-all-avatars`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Avatarlar getirilirken');
  }
};

export const updateStudentSelectAvatar = async (studentId, avatarId) => {
  try {
    const response = await axios.put(`${API_URL}/student/update-selected-avatar-by-student-id/${studentId}/avatar-id/${avatarId}`, {}, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Avatar güncellenirken');
  }
};

export const updateStudentVoiceType = async (studentId, voiceType) => {
  try {
    const response = await axios.put(
      `${API_URL}/student/update-voice-type/${studentId}`,
      { voiceType },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Ses tercihi güncellenirken');
  }
};

// #endregion

// #region Friendship Operations
export const getPendingInvites = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/games/invites/pending/${studentId}`, getStudentHeaders());
    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error) {
    handleError(error, 'Bekleyen davetler getirilirken');
  }
};

export const sendFriendRequest = async (requesterId, targetId) => {
  try {
    const response = await axios.post(
      `${API_URL}/StudentFriendship/send-request`,
      { requesterId, targetId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaşlık isteği gönderilirken');
  }
};

export const acceptFriendRequest = async (friendshipId, targetId) => {
  try {
    const response = await axios.post(
      `${API_URL}/StudentFriendship/accept-request/${friendshipId}`,
      { targetId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaşlık isteği kabul edilirken');
  }
};

export const cancelFriendRequest = async (friendshipId, requesterId) => {
  try {
    const response = await axios.post(
      `${API_URL}/StudentFriendship/cancel-request/${friendshipId}`,
      { requesterId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaşlık isteği iptal edilirken');
  }
};

export const blockFriend = async (friendshipId, blockerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/StudentFriendship/block-friend/${friendshipId}`,
      { blockerId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaş engellenirken');
  }
};

export const deleteFriendship = async (friendshipId, requesterId) => {
  try {
    const response = await axios.post(
      `${API_URL}/StudentFriendship/delete-friendship/${friendshipId}`,
      { requesterId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaşlık silinirken');
  }
};

export const getPendingRequests = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/StudentFriendship/pending-requests/${studentId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Bekleyen arkadaşlık istekleri getirilirken');
  }
};

export const getFriends = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/StudentFriendship/friends/${studentId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Arkadaşlar getirilirken');
  }
};

export const getSentRequests = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/StudentFriendship/sent-requests/${studentId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Gönderilen arkadaşlık istekleri getirilirken');
  }
};

export const getBlockedUsers = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/StudentFriendship/blocked-users/${studentId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Engellenen kullanıcılar getirilirken');
  }
};

// #endregion

// #region Course and Content Operations
export const getLearningStyleQuestions = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/course/learning-style-questions/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Learning style soruları getirilirken');
  }
};

export const postLearningStyleQuestions = async (studentId, data) => {
  try {
    const response = await axios.post(`${API_URL}/course/submit-learning-style-questions/${studentId}`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Learning style cevapları gönderilirken');
  }
};

export const getCourseLessonAndSubLessonInformationByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/course/get-course-lesson-and-sublesson-informations-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Kurs, ders ve alt ders bilgileri getirilirken');
  }
};

export const studyContentBySublessonId = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/educationContent/study-content-by-sublesson-id`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'İçerik çalışılırken');
  }
};

export const studyReviewContentBySubLessonId = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/educationContent/study-review-content-by-sublesson-id`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'İnceleme içeriği çalışılırken');
  }
};

export const getReviewContentImageStatus = async (reviewSessionId) => {
  try {
    const response = await axios.get(`${API_URL}/educationContent/images-review-content/${reviewSessionId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'İnceleme içeriği resimleri getirilirken');
  }
};

export const studySummaryBySublessonId = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/educationContent/study-summary-by-sublesson-id`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Özet çalışılırken');
  }
};

export const getReviewSessionDatas = async (studentId, courseId) => {
  try {
    const response = await axios.get(`${API_URL}/educationContent/review-session-datas/${studentId}/${courseId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'İnceleme oturumu verileri getirilirken');
  }
};

export const getImageStatus = async (contentId) => {
  try {
    const response = await axios.get(`${API_URL}/educationContent/images/${contentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Resim durumu getirilirken');
  }
};

// #endregion

// #region Color Blindness Test Operations
export const getColorBlindPlates = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/ColorBlindTest/plates/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Renk körlüğü tabloları getirilirken');
  }
};

export const submitColorBlindTest = async (studentId, answers) => {
  try {
    const payload = { studentId, answers };
    const response = await axios.post(`${API_URL}/ColorBlindTest/submit`, payload, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Renk körlüğü testi gönderilirken');
  }
};

// #endregion

// #region Chat and Assistant Operations
export const askQuestionAssistantRobot = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/chatgpt/ask-question-assistant-robot`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Asistan robotuna soru sorulurken');
  }
};

export const askQuestionContentAssistantRobot = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/educationContent/ask-question-content-assistant-robot`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'İçerik asistanına soru sorulurken');
  }
};

export const chatWithAvatar = async (studentId, message, VoiceEnable) => {
  try {
    const response = await axios.post(
      `${API_URL}/chatgpt/chat-with-avatar`,
      { studentId, message, voiceEnable: VoiceEnable },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Avatar ile sohbet edilirken');
  }
};

export const chatWithAvatarAudio = async (studentId, audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('studentId', studentId);

    const response = await axios.post(
      `${API_URL}/chatgpt/chat-with-avatar-audio`,
      formData,
      { headers: { ...getHeaders().headers, 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Sesli avatar sohbeti yapılırken');
  }
};

// #endregion

// #region Test Operations
export const getAllTestProgressByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/exam/test-process-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test ilerlemeleri getirilirken');
  }
};

export const getAllTestByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/exam/get-all-test-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Testler getirilirken');
  }
};

export const getTestByTestAndStudentId = async (studentId, testId) => {
  try {
    const response = await axios.get(`${API_URL}/exam/get-test-by-student-and-test-id/${studentId}/${testId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test getirilirken');
  }
};

export const askTestAssistantRobot = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/ask-test-assistant-robot`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test asistanına soru sorulurken');
  }
};

export const generateTest = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/generate-test`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test oluşturulurken');
  }
};

export const saveTestResult = async (data, studentId) => {
  try {
    const response = await axios.post(`${API_URL}/exam/save-test-result/${studentId}`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test sonucu kaydedilirken');
  }
};

export const compareTest = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/compare-test`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Test karşılaştırılırken');
  }
};

// #endregion

// #region Quiz Operations
export const getAllQuizByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/exam/get-all-quiz-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Quizler getirilirken');
  }
};

export const getQuizByQuizAndStudentId = async (studentId, quizId) => {
  try {
    const response = await axios.get(`${API_URL}/exam/get-quiz-by-student-and-quiz-id/${studentId}/${quizId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Quiz getirilirken');
  }
};

export const generateQuiz = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/generate-quiz`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Quiz oluşturulurken');
  }
};

export const saveQuizResult = async (data, studentId) => {
  try {
    console.log('saveQuizResult çağrıldı:', {
      endpoint: `${API_URL}/exam/save-quiz-result/${studentId}`,
      dataStructure: {
        quizID: data.quizID,
        subLessonID: data.subLessonID,
        lessonID: data.lessonID,
        studentId: data.studentId,
        title: data.title,
        durationInMilliseconds: data.durationInMilliseconds,
        questionsCount: data.quizQuestions?.length,
        questionSample: data.quizQuestions?.length > 0 ? {
          questionID: data.quizQuestions[0].questionID,
          optionsCount: data.quizQuestions[0].quizQuestionOptions?.length,
          optionSample: data.quizQuestions[0].quizQuestionOptions?.length > 0 ? {
            isSelected: data.quizQuestions[0].quizQuestionOptions[0].isSelected,
            isCorrect: data.quizQuestions[0].quizQuestionOptions[0].isCorrect
          } : null
        } : null
      }
    });

    const response = await axios.post(`${API_URL}/exam/save-quiz-result/${studentId}`, data, getHeaders());
    console.log('saveQuizResult yanıtı:', response.data);
    return response.data;
  } catch (error) {
    handleError(error, 'Quiz sonucu kaydedilirken');
  }
};

export const askQuizAssistantRobot = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/ask-quiz-assistant-robot`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Quiz asistanına soru sorulurken');
  }
};

export const compareQuiz = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/exam/compare-quiz`, data, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Quiz karşılaştırılırken');
  }
};

// #endregion

// #region Messaging Operations
export const sendMessage = async (senderId, receiverId, content) => {
  try {
    const response = await axios.post(
      `${API_URL}/Message/send`,
      { senderId, receiverId, content },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Mesaj gönderilirken');
  }
};

export const getMessages = async (studentId, otherStudentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/Message/get-messages/${studentId}/${otherStudentId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Mesajlar getirilirken');
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await axios.post(
      `${API_URL}/Message/mark-as-read/${messageId}`,
      {},
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Mesaj okundu olarak işaretlenirken');
  }
};

// #endregion

// #region Game Operations
export const getAllGames = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/games`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Oyunlar getirilirken');
  }
};

export const saveGameProgress = async (studentId, gameId, progressData) => {
  try {
    const response = await axios.post(
      `${API_URL}/games/progress`,
      { studentId, gameId, progressData },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Oyun ilerlemesi kaydedilirken');
  }
};

export const fetchStory = async (studentId, cardCount) => {
  try {
    const response = await axios.post(
      `${API_URL}/games/story`,
      { studentId, cardCount },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Hikaye getirilirken');
  }
};

export const xpProcess = async (data) => {
  try {
    console.log(data);
    const response = await axios.post(`${API_URL}/xp/process`, data, getHeaders());
    console.log('xpprocess response data:', response.data);
    return response.data;
  } catch (error) {
    handleError(error, 'XP işlenirken');
  }
};

export const getTotalXP = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/xp/total/${studentId}`, getHeaders());
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error, 'Toplam XP getirilirken');
  }
};

// #endregion

// #region Statistics and Reporting Operations
export const getStudentStatisticByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/student-stat-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Öğrenci istatistikleri getirilirken');
  }
};

export const getCourseProgressByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/course/get-course-progress-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Ders ilerlemeleri getirilirken');
  }
};

export const generateReportByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/generate-report-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Rapor oluşturulurken');
  }
};

export const getAllReportByStudentId = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/get-all-report-by-student-id/${studentId}`, getHeaders());
    return response.data;
  } catch (error) {
    handleError(error, 'Tüm raporlar getirilirken');
  }
};

// #endregion