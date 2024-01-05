"use client"
import { NextPage } from 'next';
import Image from 'next/image';
import { useState } from "react";
import RestrictedWords from '../../components/RestrictedWords'
import ImageLoaderAnimation from '../ImageLoaderAnimation/page';
import style from '../../css/TextToImage.module.css'
import FrontImage from '../../../public/front-image.webp'


const TextToImage: NextPage = () => {
  const [promptData, setPromptData] = useState<any>(null);
  const [input, setInput] = useState<string>("");
  const [show, setShow] = useState<boolean>(false);
  const [disable, setDisable] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [restrictedWordsUsed, setRestrictedWordsUsed] = useState<boolean>(false);
  const [createdImage, setCreatedImage] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);


  const fetchTextToImageData = async () => {
    if (input) {
      try {

        const response = await fetch(
          "https://api-inference.huggingface.co/models/Lykon/dreamshaper-xl-turbo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: input }),
          }
        );

        const blob = await response.blob();
        const fetchedBlob = URL.createObjectURL(blob);
        setPromptData(fetchedBlob);
        setCreatedImage(prevImg => [fetchedBlob, ...prevImg]);
        console.log(fetchedBlob);

      } catch (error) {
        console.log("error:.......", error);
      } finally {
        setLoading(false);
        setInput('');
      }

    }
  };

  const containsRestrictedWords = () => {
    const foundRestrictedWords = RestrictedWords.filter(word => new RegExp(`\\b${word}\\b`, 'i').test(input));

    if (foundRestrictedWords.length > 0) {
      setRestrictedWordsUsed(true);
      setTimeout(() => {
        setRestrictedWordsUsed(false);
      }, 5000);
      setLoading(false);
      setInput('');

    } else {
      fetchTextToImageData();
      setDisable(true);

      setTimeout(() => {
        setDisable(false);
        setTimeLeft(60);
      }, 60000);

      const intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(intervalId);
      }, 60000);
    }

  };

  const handleInput = () => {
    // e.preventDefault();
    setLoading(true);
    setShow(true);
    containsRestrictedWords();
  };

  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === 'Enter') {
      handleInput();
      
    }
  };

  const handleDownload = () => {
    if (promptData) {
      const link = document.createElement('a');
      link.href = promptData;
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
      link.download = `downloaded_image_${timestamp}.jpeg`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
    }
  }

  return (
    <div className={style.bodyContainer}>
      <h2>Text to Image Generator</h2>
      {restrictedWordsUsed ? (
        <p>Sorry but You are using restricted words!</p>
      ) : (
        <>
          {show ? (
            <>
              {!loading ? (<>
                <Image src={promptData}
                  height={250}
                  width={250}
                  alt="Result not loaded"
                  className={style.promptDataImage}
                  loading='eager' />
                <button onClick={handleDownload}  disabled={!promptData} className={style.download}>
                  Download Image <span>{"\u2B07"}</span>
                </button>
              </>
              ) : (
                <ImageLoaderAnimation />
              )}
            </>
          ) : <Image
            src={FrontImage}
            height={250}
            width={250}
            alt='Image'
            loading='eager'
            priority={true}
          />}
          <div className={style.inputAndBtn}>
            <input type="text"
              onChange={(e) => setInput(e.target.value)}
              placeholder='Enter a creative prompt here...'
              onKeyDown={handleKeyPress} 
              />
            <button type="submit" onClick={handleInput} disabled={disable} >
              Enter
            </button>
            {disable ? <p>{`Time left: ${timeLeft} seconds`}</p> : null}
          </div>
        </>
      )}
      {createdImage ? (<>
        <p>Generated Images</p>
        <div className={style.createdImageDisplay}>
          {createdImage.map((each, idx: number) => (

            <Image src={each} alt={`Image ${idx + 1}`} height={100} width={100} onClick={() => setPromptData(each)} />

          ))}
        </div>
      </>
      ) : null}
    </div>
  );
};

export default TextToImage;



