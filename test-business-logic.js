/**
 * ビジネスロジック検証用の簡単なテストスクリプト
 * 家事管理の核心機能をテストします
 */

// ブラウザのコンソールで実行するテスト関数
window.testBusinessLogic = {
  /**
   * 家事追加機能のテスト
   */
  async testAddChore() {
    console.log('🧪 Testing Add Chore Business Logic');
    
    // 家事追加フォームの要素を取得
    const input = document.querySelector('[data-testid="chore-input"]');
    const addButton = document.querySelector('[data-testid="add-chore-button"]');
    
    if (!input || !addButton) {
      console.error('❌ 家事追加フォームの要素が見つかりません');
      return false;
    }
    
    // テスト用の家事タイトル
    const testChoreTitle = `テスト家事 - ${new Date().toLocaleTimeString()}`;
    
    // 入力フィールドに値を設定
    input.value = testChoreTitle;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('📝 家事タイトルを入力:', testChoreTitle);
    
    // 追加ボタンをクリック
    addButton.click();
    
    console.log('🔄 家事追加処理を実行中...');
    
    // 少し待ってから結果を確認
    setTimeout(() => {
      const choreItems = document.querySelectorAll('[data-testid="chore-item"]');
      const addedChore = Array.from(choreItems).find(item => 
        item.textContent.includes(testChoreTitle)
      );
      
      if (addedChore) {
        console.log('✅ 家事追加成功: 一覧に表示されました');
        return true;
      } else {
        console.error('❌ 家事追加失敗: 一覧に表示されていません');
        return false;
      }
    }, 2000);
  },
  
  /**
   * 家事完了切り替え機能のテスト
   */
  async testToggleChore() {
    console.log('🧪 Testing Toggle Chore Business Logic');
    
    const choreItems = document.querySelectorAll('[data-testid="chore-item"]');
    if (choreItems.length === 0) {
      console.error('❌ テスト対象の家事が見つかりません');
      return false;
    }
    
    const firstChore = choreItems[0];
    const toggleButton = firstChore.querySelector('[data-testid="toggle-chore-button"]');
    
    if (!toggleButton) {
      console.error('❌ 完了ボタンが見つかりません');
      return false;
    }
    
    console.log('🔄 家事完了状態を切り替え中...');
    toggleButton.click();
    
    setTimeout(() => {
      console.log('✅ 家事完了切り替え処理完了');
    }, 1000);
  },
  
  /**
   * 家事削除機能のテスト
   */
  async testDeleteChore() {
    console.log('🧪 Testing Delete Chore Business Logic');
    
    const choreItems = document.querySelectorAll('[data-testid="chore-item"]');
    if (choreItems.length === 0) {
      console.error('❌ 削除対象の家事が見つかりません');
      return false;
    }
    
    const lastChore = choreItems[choreItems.length - 1];
    const deleteButton = lastChore.querySelector('[data-testid="delete-chore-button"]');
    
    if (!deleteButton) {
      console.error('❌ 削除ボタンが見つかりません');
      return false;
    }
    
    const choreTitle = lastChore.textContent;
    console.log('🗑️ 家事を削除中:', choreTitle);
    
    deleteButton.click();
    
    setTimeout(() => {
      const remainingItems = document.querySelectorAll('[data-testid="chore-item"]');
      const deletedChore = Array.from(remainingItems).find(item => 
        item.textContent.includes(choreTitle)
      );
      
      if (!deletedChore) {
        console.log('✅ 家事削除成功: 一覧から削除されました');
        return true;
      } else {
        console.error('❌ 家事削除失敗: まだ一覧に残っています');
        return false;
      }
    }, 1000);
  },
  
  /**
   * 全機能の統合テスト
   */
  async runAllTests() {
    console.log('🚀 ビジネスロジック統合テスト開始');
    
    await this.testAddChore();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await this.testToggleChore();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.testDeleteChore();
    
    console.log('🏁 ビジネスロジック統合テスト完了');
  }
};

console.log('📋 ビジネスロジックテスト関数が利用可能です:');
console.log('- window.testBusinessLogic.testAddChore()');
console.log('- window.testBusinessLogic.testToggleChore()');
console.log('- window.testBusinessLogic.testDeleteChore()');
console.log('- window.testBusinessLogic.runAllTests()');