import { useState } from 'react';
import './App.css';

function App() {
  const [inputFields, setInputFields] = useState([]);
  const [permFields, setPermFields] = useState([
    {
      wifi_name:"",
      wifi_password:"",
      wnum:"",
      apik:""
    }
  ]);
  const [code, setCode] = useState("");
  
  const handleFormChange = (index, event) => {
    let data = [...inputFields];
    data[index][event.target.name] = event.target.value;
    setInputFields(data);
 }

  const handlePermForm = (event) => {
    let data = [...permFields];
    data[0][event.target.name] = event.target.value;
    setPermFields(data);
  }

  const addBlock = () => {
    let newfield = {
      thumb:"",
      indexf:"",
      middle:"",
      ring:"",
      pinky:"",
      y_angle:"",
      z_angle:"",
      message:""
    }
    setInputFields([...inputFields, newfield]);
  }
  const Generate = (e) => {
    e.preventDefault();
    let conditionals="";
    for(let i=0; i<inputFields.length; i++){
      let thumbcond=inputFields[i].thumb===""? "": `&& thumbdiff>${inputFields[i].thumb}`;
      let indexcond=inputFields[i].indexf===""? "": `&& indexdiff>${inputFields[i].indexf}`;
      let middlecond=inputFields[i].middle===""? "": `&& middlediff>${inputFields[i].middle}`;
      let ringcond=inputFields[i].ring===""? "": `&& ringdiff>${inputFields[i].ring}`;
      let pinkycond=inputFields[i].pinky===""? "": `&& pinkydiff>${inputFields[i].pinky}`;
      let ycond=inputFields[i].y_angle===""? "": `&& angle.y>${inputFields[i].y_angle}`;
      let zcond=inputFields[i].z_angle===""? "": `&& angle.z>${inputFields[i].z_angle}`;
      conditionals=conditionals+`if(sent==false ${thumbcond} ${indexcond} ${middlecond} ${ringcond} ${pinkycond} ${ycond} ${zcond}){
        Serial.println("${inputFields[i].message}");
        sendMessage("${inputFields[i].message}");
        delay(2000);
      } \n`
    }
    setCode(`
    #include <Wire.h>
    #include <MPU9250_WE.h>
    #include <SPI.h>
    #include <Adafruit_GFX.h>
    #include <Adafruit_SSD1306.h>
    #include <WiFi.h>
    #include <HTTPClient.h>
    #include <UrlEncode.h>

    //flex settings
    #define thumbpin 32
    #define indexpin 35
    #define middlepin 34
    #define ringpin 39
    #define pinkypin 36

    //Display settings
    #define SCREEN_WIDTH 128
    #define SCREEN_HEIGHT 64
    #define OLED_RESET     -1 
    #define SCREEN_ADDRESS 0x3C 
    Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

    //gyro settings
    #define MPU9250_ADDR 0x68
    MPU9250_WE myMPU9250 = MPU9250_WE(MPU9250_ADDR);

    //Notification system settings\n
    const char* ssid = "${permFields[0].wifi_name}";
    const char* password = "${permFields[0].wifi_password}";
    String phoneNumber = "${permFields[0].wnum}";
    String apiKey = "${permFields[0].apik}";
    
    //send notification function
    void sendMessage(String message){

      String url = "https://api.callmebot.com/whatsapp.php?phone=" + phoneNumber + "&apikey=" + apiKey + "&text=" + urlEncode(message);  
      HTTPClient http;
      http.begin(url);

      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      
      int httpResponseCode = http.POST(url);
      if (httpResponseCode == 200){
        Serial.println("Message sent successfully");
      }
      else{
        Serial.println("Error sending the message");
        Serial.print("HTTP response code: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    }

    void setup() {
      Serial.begin(115200);
      
      //gyro initialization
      Wire.begin();
      if(!myMPU9250.init()){
        Serial.println("MPU9250 does not respond");
      }
      else{
        Serial.println("MPU9250 is connected");
      }
      Serial.println("Position you MPU9250 flat and don't move it - calibrating...");
      delay(1000);
      myMPU9250.autoOffsets();
      Serial.println("Done!");
      myMPU9250.setSampleRateDivider(5);
      myMPU9250.setAccRange(MPU9250_ACC_RANGE_2G);
      myMPU9250.enableAccDLPF(true);
      myMPU9250.setAccDLPF(MPU9250_DLPF_6);

      //display initialization
      display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS);
      display.clearDisplay();

      //notiification initialization
      WiFi.begin(ssid, password);
      Serial.println("Connecting");
      while(WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println("");
      Serial.print("Connected to WiFi network with IP Address: ");
      Serial.println(WiFi.localIP());

      //pin init
      pinMode(32, INPUT);
      pinMode(34, INPUT);
      pinMode(35, INPUT);
      pinMode(39, INPUT);
      pinMode(36, INPUT);
    }

    int thumb[2], indes[2], middle[2], ring[2], pinky[2];
    bool scanned=false, sent;

    void loop() {  
      
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(WHITE);
      display.setCursor(0,0); 
      
      Serial.println("start"); 
      xyzFloat angles = myMPU9250.getAngles(); 
      //hand down state
      if (angles.x<50){
      thumb[0]=analogRead(thumbpin);
      indes[0]=analogRead(indexpin);
      middle[0]=analogRead(middlepin);  
      ring[0]=analogRead(ringpin);
      pinky[0]=analogRead(pinkypin);
      scanned=true;
      sent=false;}
      //hand up state
      if (angles.x>50){
      thumb[1]=analogRead(thumbpin);
      indes[1]=analogRead(indexpin);
      middle[1]=analogRead(middlepin);  
      ring[1]=analogRead(ringpin);
      pinky[1]=analogRead(pinkypin);}  
      //thumb
      int thumbdiff=thumb[0]-thumb[1];
      display.print("thumb: ");
      display.println(thumbdiff);
      //index
      int indexdiff=indes[0]-indes[1];
      display.print("index: ");
      display.println(indexdiff);
      //middle
      int middlediff=middle[0]-middle[1];
      display.print("middle: ");
      display.println(middlediff);
      //ring
      int ringdiff=ring[0]-ring[1];
      display.print("ring: ");
      display.println(ringdiff);
      //pinky
      int pinkydiff=pinky[0]-pinky[1];
      display.print("pinky: ");
      display.println(pinkydiff);
      //angles  
      display.println("angles (x,y,z): ");
      display.print(angles.x);
      display.print(",");
      display.print(angles.y);
      display.print(",");
      display.println(angles.z);
      display.display();

      if(scanned==true){
        thumb[1]=0;
        indes[1]=0;
        middle[1]=0;
        ring[1]=0;
        pinky[1]=0;  
        scanned=false;  
      }\n`+ conditionals
      )
  }
  const copyToClip=()=>{
    navigator.clipboard.writeText(code);
  }
  return (
    <div className="App">
      <div className="app-header">
        <h1 className="heading">GloveCode</h1>
      </div>
      <div className="perma_details-box">
        <div className="wifi_details-box">
        <form className='wifi-labels'>
          <label>Enter WiFi name:
              <input name='wifi_name' onChange={handlePermForm} />
          </label>
          <label>Enter WiFi password:
              <input name='wifi_password' onChange={handlePermForm} />
          </label>
        </form>
        </div>
        <div className="phone_details-box">
          <form className='phone-labels'>
          <label>Enter WhatsApp number:
              <input name='wnum' onChange={handlePermForm} />
          </label>
          <label>Enter API key:
              <input name='apik' onChange={handlePermForm} />
          </label>
          </form>
        </div>
      </div>
      {inputFields.map((input, index)=>(<div key={index} className="palm_details-box">
        <div className="finger_details-box">
          <form className='finger_details-box-small'>
          <label>Thumb:
            <input name='thumb' value={input.thumb} onChange={event => handleFormChange(index, event)} />
          </label>
          <label>Index:
            <input name='indexf' value={input.indexf} onChange={event => handleFormChange(index, event)} />
          </label>
          <label>Middle:
            <input name='middle' value={input.middle} onChange={event => handleFormChange(index, event)} />
          </label>
          <label>Ring:
            <input name='ring' value={input.ring} onChange={event => handleFormChange(index, event)}/>
          </label>
          <label>Pinky:
            <input name='pinky' value={input.pinky} onChange={event => handleFormChange(index, event)}/>
          </label>
          </form>
        </div>
        <div className="palm_angle_details-box">
          <form className='palm_angle_details-box-small'>
            <label>y-angle:
              <input name='y_angle' value={input.y_angle} onChange={event => handleFormChange(index, event)}/>
            </label>
            <label>z-angle:
              <input name='z_angle' value={input.z_angle} onChange={event => handleFormChange(index, event)}/>
            </label>
          </form>
        </div>
        <div className='message-box'>
          <form className='message-box-small'>
            <label>Enter message:
              <input name='message' value={input.message} onChange={event => handleFormChange(index, event)}/>
            </label>
          </form>
        </div>
      </div>))}
      <div className="big-button-box">
      <div className="add-button-box" onClick={addBlock}>
        <div className='add-button'>+</div>
      </div>
      </div>
      <div className='gen_code-big-box'>
      <div className="gen_code-button-box" onClick={Generate}>
        <div className="gen_code-button">Generate</div>
      </div>
      </div>
      <div className='code-box-big'>
        <div className="code-box" style={{ whiteSpace: 'pre-line' }} >
          {code}
          <div className='copy' onClick={copyToClip}>Copy</div>
        </div>
      </div>
    </div>
  );
}

export default App;
