<template>
  <div :class="prefixCls">
    <LoginFormTitle v-show="getShow" class="enter-x" />
    <Form
      class="p-4 enter-x"
      :model="formData"
      :rules="getFormRules"
      ref="formRef"
      v-show="getShow"
      @keypress.enter="handleLogin"
    >
      <FormItem name="account" class="enter-x">
        <Input
          size="large"
          v-model:value="formData.account"
          :placeholder="t('sys.login.userName')"
          class="fix-auto-fill"
        />
      </FormItem>
      <FormItem name="password" class="enter-x">
        <InputPassword
          size="large"
          visibilityToggle
          v-model:value="formData.password"
          :placeholder="t('sys.login.password')"
        />
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" size="large" block @click="handleLogin" :loading="loading">
          {{ t('sys.login.loginButton') }}
        </Button>
        <Button
          v-if="loginType === 'user'" 
          size="large" 
          block 
          class="mt-4" 
          @click="handleRegister" 
          :loading="loading">
        
          注册账号
        </Button>
      </FormItem>

      <FormItem class="enter-x">
        <Radio.Group v-model:value="loginType" class="w-full">
          <Radio value="user">用户登录</Radio>
          <Radio value="admin">管理员登录</Radio>
        </Radio.Group>
      </FormItem>

      <FormItem class="enter-x">
        <Button v-if="loginType === 'admin'" type="primary" @click="startCamera">开启摄像头</Button>
      </FormItem>
    </Form>

    <Modal
      v-model:visible="showFaceModal"
      title="管理员人脸验证"
      @cancel="handleFaceCancel"
      :maskClosable="false"
    >
      <div class="camera-container">
        <video
          ref="videoRef"
          :style="{ display: capturedImage ? 'none' : 'block' }"
          width="100%"
          autoplay
        ></video>
        <img
          :src="capturedImage"
          :style="{ display: capturedImage ? 'block' : 'none' }"
          width="100%"
        />
        <canvas ref="canvasRef" style="display: none;"></canvas>
      </div>
      <template #footer>
        <Button v-if="!capturedImage" type="primary" @click="capture">拍照</Button>
        <Button v-if="capturedImage" @click="retake">重新拍照</Button>
        <Button v-if="capturedImage" type="primary" @click="confirmCapture">确定</Button>
      </template>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, unref, computed, onUnmounted, nextTick } from 'vue';
import { Form, Input, Button, Modal, Radio } from 'ant-design-vue';
import LoginFormTitle from './LoginFormTitle.vue';
import { useI18n } from '@/hooks/web/useI18n';
import { useMessage } from '@/hooks/web/useMessage';
import { useUserStore } from '@/store/modules/user';
import { LoginStateEnum, useLoginState, useFormRules, useFormValid } from './useLogin';
import { useDesign } from '@/hooks/web/useDesign';
import type { LoginParams } from '@/store/modules/user';

const FormItem = Form.Item;
const InputPassword = Input.Password;
const { t } = useI18n();
const { notification, createErrorModal } = useMessage();
const { prefixCls } = useDesign('login');
const userStore = useUserStore();

const { getLoginState } = useLoginState();
const { getFormRules } = useFormRules();

const formRef = ref();
const loading = ref(false);
const loginType = ref<'user' | 'admin'>('user');
const showFaceModal = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const capturedImage = ref<string | undefined>(undefined);
const stream = ref<MediaStream | null>(null);

const formData = reactive({
  account: '',
  password: '',
});

const { validForm } = useFormValid(formRef);
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

async function startCamera() {
  try {
    showFaceModal.value = true;
    await nextTick(); // 确保 videoRef 已经被引用
    if (videoRef.value) {
      stream.value = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.value.srcObject = stream.value;
      await videoRef.value.play();
      
      // 翻转视频流
      videoRef.value.style.transform = 'scaleX(-1)'; // 水平翻转
    }
  } catch (err) {
    console.error(err);
    createErrorModal({
      title: '摄像头错误',
      content: '无法访问摄像头，请确保已授予摄像头权限',
    });
  }
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }
}

function capture() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (video && canvas) {
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 翻转图像
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      
      // 绘制视频帧到画布
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 获取 Base64 编码
      capturedImage.value = canvas.toDataURL('image/png');
      console.log('Captured Image:', capturedImage.value);
    }
  }
}

function retake() {
  capturedImage.value = undefined;
  startCamera();
}

function handleFaceCancel() {
  showFaceModal.value = false;
  stopCamera();
  capturedImage.value = undefined;
}

function confirmCapture() {
  // 在这里处理确认后的逻辑
  console.log('Image confirmed:', capturedImage.value);
  // 关闭模态框或执行其他操作
  showFaceModal.value = false;
}

async function handleLogin() {
  const data = await validForm();
  if (!data) return;

  try {
    loading.value = true;
    const loginParams: LoginParams & { image?: string } = {
      username: data.account,
      password: data.password,
      loginType: loginType.value,
    };

    // 如果是管理员，确保已经捕获了人脸图像
    if (loginType.value === 'admin') {
      if (!capturedImage.value) {
        createErrorModal({
          title: '人脸识别错误',
          content: '请先拍摄人脸照片',
        });
        loading.value = false;
        return;
      }
      loginParams.image = capturedImage.value;
    }

    const userInfo = await userStore.login(loginParams);

    console.log(userInfo);

    if (userInfo) {
      notification.success({
        message: t('sys.login.loginSuccessTitle'),
        description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.realName}`,
        duration: 3,
      });
    }
  } catch (error) {
    console.error(error);
    createErrorModal({
      title: t('sys.api.errorTip'),
      content: (error as unknown as Error).message || t('sys.api.networkExceptionMsg'),
    });
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  const data = await validForm();
  if (!data) return;
  
  try {
    loading.value = true;
    await userStore.register({
      username: data.account,
      password: data.password
    });

    // 如果没有抛出错误，就认为注册成功
    notification.success({
      message: '注册成功',
      description: '请使用新账号密码登录',
      duration: 3,
    });
  } catch (error) {
    createErrorModal({
      title: '注册失败',
      content: (error as unknown as Error).message || '注册过程中发生错误',
    });
  } finally {
    loading.value = false;
  }
}

onUnmounted(() => {
  stopCamera();
});
</script>

<style lang="less" scoped>
.camera-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

video, img {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
</style>