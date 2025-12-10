import axios from "axios";
import { LEARNVERSE_API_BASE_URL } from "../config/config.js";

const api = axios.create({
  baseURL: `${LEARNVERSE_API_BASE_URL}/api/v1`,
});

export const getBranches = async () => {
  try {
    const response = await api.get("/branch");
    return response.data;
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
};

export const getBranchById = async (branchId) => {
  try {
    const response = await api.get(`/branch/${branchId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching branch:", error);
    return null;
  }
};

export const getYears = async () => {
  try {
    const response = await api.get("/year");
    return response.data;
  } catch (error) {
    console.error("Error fetching years:", error);
    return [];
  }
};

export const getYearById = async (yearId) => {
  try {
    const response = await api.get(`/year/${yearId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching year:", error);
    return null;
  }
};

export const getAllSyllabi = async () => {
  try {
    const response = await api.get("/syllabus");
    return response.data;
  } catch (error) {
    console.error("Error fetching syllabi:", error);
    return [];
  }
};

export const getSyllabusById = async (syllabusId) => {
  try {
    const response = await api.get(`/syllabus/${syllabusId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    return null;
  }
};

export const getAllSubjects = async () => {
  try {
    const response = await api.get("/subject");
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

export const getSubjectById = async (subjectId) => {
  try {
    const response = await api.get(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subject:", error);
    return null;
  }
};

export const getFileById = async (fileId) => {
  try {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching file:", error);
    return null;
  }
};
