"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, Square, Play, Pause, Trash2 } from "lucide-react";

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
}

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(videoBlob);
        setVideoURL(url);
        onRecordingComplete(videoBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setDuration(0);
    videoChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        muted={isRecording}
        playsInline
        className={`w-full rounded-lg border ${!isRecording && !videoURL ? "hidden" : ""}`}
        src={videoURL || undefined}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        {!isRecording && !videoURL && (
          <Button type="button" onClick={startRecording} variant="default">
            <Video className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatTime(duration)}</span>
            </div>
            <Button type="button" onClick={stopRecording} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {videoURL && !isRecording && (
          <div className="flex items-center gap-2 flex-1">
            <Button type="button" onClick={togglePlayback} variant="outline">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm">{formatTime(duration)}</span>
            <Button type="button" onClick={deleteRecording} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
