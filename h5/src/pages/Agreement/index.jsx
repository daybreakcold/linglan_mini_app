import { useParams } from 'react-router-dom'
import styles from './index.module.scss'

// 用户协议内容
const USER_AGREEMENT = `
<h2>灵壹健康用户协议</h2>

<h3>一、服务说明</h3>
<p>欢迎使用灵壹健康平台提供的健康咨询服务。本平台提供中医健康科普、AI健康咨询等服务，旨在为用户提供专业的健康知识和建议。</p>

<h3>二、用户责任</h3>
<p>1. 用户应提供真实、准确的个人信息。</p>
<p>2. 用户应妥善保管账号信息，不得将账号转让或借用给他人。</p>
<p>3. 用户不得利用本平台从事任何违法违规活动。</p>

<h3>三、免责声明</h3>
<p>1. 本平台提供的健康咨询仅供参考，不能替代专业医疗诊断和治疗。</p>
<p>2. 如有身体不适，请及时就医。</p>

<h3>四、知识产权</h3>
<p>本平台所有内容（包括但不限于文字、图片、视频等）的知识产权归灵壹健康所有。</p>

<h3>五、协议修改</h3>
<p>灵壹健康有权根据需要修改本协议，修改后的协议将在平台公布。</p>

<h3>六、联系我们</h3>
<p>如有任何问题，请联系客服。</p>
`

// 隐私政策内容
const PRIVACY_POLICY = `
<h2>灵壹健康隐私政策</h2>

<h3>一、信息收集</h3>
<p>我们可能收集以下信息：</p>
<p>1. 您主动提供的信息：手机号、姓名、健康信息等。</p>
<p>2. 自动收集的信息：设备信息、使用记录等。</p>

<h3>二、信息使用</h3>
<p>我们收集的信息将用于：</p>
<p>1. 提供和改进服务</p>
<p>2. 个性化健康建议</p>
<p>3. 安全防护</p>

<h3>三、信息保护</h3>
<p>我们采取严格的安全措施保护您的个人信息，包括：</p>
<p>1. 数据加密传输和存储</p>
<p>2. 访问权限控制</p>
<p>3. 定期安全审计</p>

<h3>四、信息共享</h3>
<p>我们不会将您的个人信息出售给第三方。仅在以下情况下可能共享：</p>
<p>1. 经您明确同意</p>
<p>2. 法律法规要求</p>

<h3>五、用户权利</h3>
<p>您有权：</p>
<p>1. 查看和更正个人信息</p>
<p>2. 删除个人信息</p>
<p>3. 撤回授权同意</p>

<h3>六、未成年人保护</h3>
<p>如您为未成年人，请在监护人指导下使用本服务。</p>

<h3>七、联系我们</h3>
<p>如有任何隐私相关问题，请联系客服。</p>
`

function Agreement() {
  const { type = 'user' } = useParams()

  const isPrivacy = type === 'privacy'
  const title = isPrivacy ? '隐私政策' : '用户协议'
  const content = isPrivacy ? PRIVACY_POLICY : USER_AGREEMENT

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

export default Agreement
