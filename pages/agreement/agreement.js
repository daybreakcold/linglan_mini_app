// pages/agreement/agreement.js

// 协议内容配置
const AGREEMENTS = {
  user: {
    title: '用户协议',
    content: `
<h2>《灵壹健康用户协议》</h2>
<p class="en-title">ZeroOne Health User Agreement</p>

<h3>一、服务说明</h3>
<p class="en-section">1. Service Description</p>
<p>本小程序由上海简一云麦数字科技有限公司运营，提供健康问询与线上课程，不构成医疗行为。</p>
<p class="en-text">This Mini Program is operated by Shanghai Jianyi Yunmai Digital Technology Co., Ltd., providing health inquiry and online learning services, which do not constitute medical diagnosis or treatment.</p>

<h3>二、会员订阅与付费</h3>
<p class="en-section">2. Membership Subscription & Payment</p>
<p>会员采用订阅制，通过微信支付扣款。费用一经支付不予退还，除非法律另有规定。</p>
<p class="en-text">Membership uses a subscription-based model processed via WeChat Pay. Fees are nonrefundable unless otherwise required by law.</p>

<h3>三、法律争议</h3>
<p class="en-section">3. Legal Disputes</p>
<p>本协议最终解释权归上海简一云麦数字科技有限公司所有。如发生争议，以上海市闵行区中级人民法院为最终审理法院。</p>
<p class="en-text">The final interpretation right of this Agreement belongs to Shanghai Jianyi Yunmai Digital Technology Co., Ltd. Any dispute shall be submitted to Shanghai Minhang District Intermediate People's Court.</p>

<h3>四、联系方式</h3>
<p class="en-section">4. Contact Information</p>
<p>联系邮箱：fentti@163.com</p>
<p>联系地址：上海市崇明区中兴镇北滧公路 2277 弄 1 号楼</p>
<p class="en-text">Contact Email: fentti@163.com</p>
<p class="en-text">Contact Address: Building 1, No. 2277 Beiyao Road, Zhongxing Town, Chongming District, Shanghai</p>
`
  },
  privacy: {
    title: '隐私政策',
    content: `
<h2>《灵壹健康用户隐私保护条例》</h2>
<p class="en-title">ZeroOne Health User Privacy Protection Regulation</p>

<h3>一、总则</h3>
<p class="en-section">1. General Provisions</p>
<p>本条例由上海简一云麦数字科技有限公司制定，旨在保护用户在使用灵壹健康微信小程序期间的隐私与数据安全。本条例具有法律效力并严格遵守中华人民共和国相关法律法规。</p>
<p class="en-text">This regulation is established by Shanghai Jianyi Yunmai Digital Technology Co., Ltd. to protect user privacy and data security when using the ZeroOne Health WeChat Mini Program. It complies with the laws and regulations of the People's Republic of China.</p>

<h3>二、用户信息收集范围</h3>
<p class="en-section">2. Scope of User Information Collection</p>
<p>我们仅收集为提供服务所必需的个人信息，包括但不限于账号数据、使用日志、设备信息、健康问询相关信息等。</p>
<p class="en-text">We collect only the personal information necessary to provide services, including but not limited to account data, usage logs, device information, and health inquiry-related information.</p>

<h3>三、用户信息使用规则</h3>
<p class="en-section">3. Rules for Using User Information</p>
<p>收集的信息仅用于：提供服务、优化体验、支付与订单处理、安全监控及符合法律法规要求的场景。</p>
<p class="en-text">Collected information is used only for providing services, optimizing user experience, processing payments and orders, security monitoring, and legal compliance.</p>

<h3>四、信息共享与披露限制</h3>
<p class="en-section">4. Restrictions on Information Sharing & Disclosure</p>
<p>除非获得用户明确授权或法律要求，我们不会向任何第三方共享、出售或披露个人信息。</p>
<p class="en-text">We will not share, sell, or disclose personal information to any third party unless explicitly authorized by the user or required by law.</p>

<h3>五、数据存储与安全保护</h3>
<p class="en-section">5. Data Storage & Security Protection</p>
<p>所有用户数据均存储在中国境内服务器，并采用加密、访问控制、身份验证等措施确保数据安全。</p>
<p class="en-text">All user data is stored within mainland China and protected through encryption, access control, and authentication measures.</p>

<h3>六、用户权利</h3>
<p class="en-section">6. User Rights</p>
<p>用户享有访问、更正、删除个人信息及撤回授权的权利（法律另有规定的除外）。</p>
<p class="en-text">Users have the right to access, correct, delete their personal information, and withdraw authorization (unless restricted by law).</p>

<h3>七、未成年人保护</h3>
<p class="en-section">7. Protection of Minors</p>
<p>未满18周岁的用户应由监护人指导下使用本小程序，我们不会主动收集未成年人的敏感隐私数据。</p>
<p class="en-text">Users under the age of 18 should use the Mini Program with guardian guidance. We do not intentionally collect sensitive data from minors.</p>

<h3>八、法律责任与争议解决</h3>
<p class="en-section">8. Legal Liability & Dispute Resolution</p>
<p>本条例最终解释权归上海简一云麦数字科技有限公司所有。若发生争议以上海市闵行区中级人民法院为最终审理法院。</p>
<p class="en-text">The final interpretation right of this regulation belongs to Shanghai Jianyi Yunmai Digital Technology Co., Ltd. Any dispute shall be submitted to Shanghai Minhang District Intermediate People's Court.</p>

<h3>九、联系方式</h3>
<p class="en-section">9. Contact Information</p>
<p>联系邮箱：fentti@163.com</p>
<p>联系地址：上海市崇明区中兴镇北滧公路 2277 弄 1 号楼</p>
<p class="en-text">Email: fentti@163.com</p>
<p class="en-text">Address: Building 1, No. 2277 Beiyao Road, Zhongxing Town, Chongming District, Shanghai</p>
`
  }
}

Page({
  data: {
    title: '',
    content: ''
  },

  onLoad(options) {
    const { type } = options
    const agreement = AGREEMENTS[type] || AGREEMENTS.user

    this.setData({
      title: agreement.title,
      content: agreement.content
    })

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: agreement.title
    })
  }
})
